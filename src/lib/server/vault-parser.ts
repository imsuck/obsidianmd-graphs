/**
 * Server-side vault parser.
 * Reads .md files from an Obsidian vault directory, extracts
 * wikilinks, frontmatter, and tags, and produces a graph.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, basename, dirname } from "node:path";
import matter from "gray-matter";
import type { GraphData, GraphNode, GraphLink, VaultConfig } from "../types.js";

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

// Matches [[target|alias]], [[target#heading]], [[target^block]], [[target]]
const WIKILINK_RE =
    /\[\[([^\]|#^]+?)(?:#[^\]|]*)?(?:\^[^\]|]*)?(?:\|[^\]]+?)?\]\]/g;

// Matches #tag and #tag/nested/path (but not inside code blocks ideally)
const TAG_RE = /(?:^|\s)#([\w][\w/-]*)/g;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function parseVault(config: VaultConfig): Promise<GraphData> {
    const mdFiles = await collectMarkdownFiles(config.vaultPath);
    const nodeMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];
    const fileIndex = buildFileIndex(mdFiles, config.vaultPath);
    const existingPaths = new Set(fileIndex.values());

    for (const filePath of mdFiles) {
        const relPath = relative(config.vaultPath, filePath);
        const noteName = basename(relPath, ".md");
        const noteId = relPath;

        // Register note node
        if (!nodeMap.has(noteId)) {
            nodeMap.set(noteId, {
                id: noteId,
                name: noteName,
                type: "note",
                val: 1,
            });
        }

        const raw = await readFile(filePath, "utf-8");
        const { data: frontmatter, content } = matter(raw);

        // --- Extract wikilinks from body ---
        const bodyLinks = extractWikilinks(content);

        // --- Extract wikilinks from frontmatter values ---
        const fmLinks = extractWikilinksFromFrontmatter(frontmatter);

        const allWikilinks = [...bodyLinks, ...fmLinks];

        for (const target of allWikilinks) {
            const resolvedId = resolveWikilink(
                target,
                noteId,
                fileIndex,
                config,
            );
            const resolvedNode = nodeMap.get(resolvedId);

            if (!resolvedNode) {
                // Create unresolved or note node
                const exists = existingPaths.has(resolvedId);

                // A link is unresolved only if it's supposed to be a .md file and it wasn't found in the index.
                // Non-.md files (e.g. images, pdfs) are considered "real" links.
                const lastDotIndex = resolvedId.lastIndexOf(".");
                const hasExtension = lastDotIndex > resolvedId.lastIndexOf("/");
                const isMd =
                    resolvedId.toLowerCase().endsWith(".md") || !hasExtension;

                nodeMap.set(resolvedId, {
                    id: resolvedId,
                    name: basename(resolvedId, ".md"),
                    type: isMd && !exists ? "unresolved" : "note",
                    val: 1,
                });
            }

            links.push({
                source: noteId,
                target: resolvedId,
                type: "wikilink",
            });
        }

        // --- Extract tags from body ---
        const bodyTags = extractTags(content);

        // --- Extract tags from frontmatter ---
        const fmTags = extractFrontmatterTags(frontmatter);

        const allTags = [...new Set([...bodyTags, ...fmTags])];

        for (const tag of allTags) {
            processTag(tag, noteId, config.tagMode, nodeMap, links);
        }
    }

    // Compute node degrees for sizing
    const nodes = [...nodeMap.values()];
    const degreeCounts = new Map<string, number>();
    for (const link of links) {
        const s =
            typeof link.source === "string" ? link.source : link.source.id;
        const t =
            typeof link.target === "string" ? link.target : link.target.id;
        degreeCounts.set(s, (degreeCounts.get(s) ?? 0) + 1);
        degreeCounts.set(t, (degreeCounts.get(t) ?? 0) + 1);
    }
    for (const node of nodes) {
        node.val = Math.max(1, degreeCounts.get(node.id) ?? 1);
    }

    return { nodes, links };
}

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

async function collectMarkdownFiles(dirPath: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        // Skip hidden directories and common non-vault dirs
        if (entry.name.startsWith(".") || entry.name === "node_modules")
            continue;

        if (entry.isDirectory()) {
            const subFiles = await collectMarkdownFiles(fullPath);
            results.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Build a case-insensitive index: lowercased basename (without .md) -> relative path
 * This supports Obsidian's default "shortest path" link resolution.
 */
function buildFileIndex(
    files: string[],
    vaultPath: string,
): Map<string, string> {
    const index = new Map<string, string>();

    for (const filePath of files) {
        const relPath = relative(vaultPath, filePath);
        const name = basename(relPath, ".md").toLowerCase();

        // If there's a collision, prefer the shorter path
        if (!index.has(name) || relPath.length < index.get(name)!.length) {
            index.set(name, relPath);
        }
    }

    return index;
}

function removeCodeBlocks(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, (match) => " ".repeat(match.length))
        .replace(/`[^`\n]*`/g, (match) => " ".repeat(match.length))
        .replace(/\$\$[\s\S]*?\$\$/g, (match) => " ".repeat(match.length))
        .replace(/\$[^$\n]*?\$/g, (match) => " ".repeat(match.length));
}

// ---------------------------------------------------------------------------
// Wikilink extraction
// ---------------------------------------------------------------------------

function extractWikilinks(text: string): string[] {
    const results: string[] = [];
    let match: RegExpExecArray | null;
    const strippedText = removeCodeBlocks(text);
    const re = new RegExp(WIKILINK_RE.source, WIKILINK_RE.flags);

    while ((match = re.exec(strippedText)) !== null) {
        const target = match[1].trim();
        if (target) results.push(target);
    }

    return results;
}

function extractWikilinksFromFrontmatter(
    fm: Record<string, unknown>,
): string[] {
    const results: string[] = [];

    function walk(val: unknown) {
        if (typeof val === "string") {
            results.push(...extractWikilinks(val));
        } else if (Array.isArray(val)) {
            for (const item of val) walk(item);
        } else if (val && typeof val === "object") {
            for (const v of Object.values(val)) walk(v);
        }
    }

    walk(fm);
    return results;
}

function resolveWikilink(
    target: string,
    sourceId: string,
    fileIndex: Map<string, string>,
    config: VaultConfig,
): string {
    const withMd = target.endsWith(".md") ? target : target + ".md";
    const key = basename(target, ".md").toLowerCase();

    if (config.linkMode === "auto") {
        // Obsidian default: shortest-path-when-possible
        // 1. Try basename match (most common case in Obsidian)
        if (fileIndex.has(key)) {
            return fileIndex.get(key)!;
        }
        // 2. Try path-suffix match for links like "subfolder/Note"
        if (target.includes("/")) {
            const suffix = withMd.toLowerCase();
            for (const [, relPath] of fileIndex) {
                if (relPath.toLowerCase().endsWith(suffix)) return relPath;
            }
        }
        // 3. Unresolved
        return target;
    }

    // Try exact path match first (for absolute-style links)
    if (fileIndex.has(target.toLowerCase())) {
        return fileIndex.get(target.toLowerCase())!;
    }

    // Try resolving relative to the source file
    if (config.linkMode === "relative") {
        const sourceDir = dirname(sourceId);
        const relativeTarget = join(sourceDir, withMd);
        // Check if this resolved path exists in our file set
        const normalized = relativeTarget.replace(/\\/g, "/");
        for (const [, relPath] of fileIndex) {
            if (relPath === normalized) return relPath;
        }
    }

    // Fallback: use the file index (shortest match)
    if (fileIndex.has(key)) {
        return fileIndex.get(key)!;
    }

    // Unresolved — use the raw target as ID
    return target;
}

// ---------------------------------------------------------------------------
// Tag extraction
// ---------------------------------------------------------------------------

function extractTags(text: string): string[] {
    const results: string[] = [];
    let match: RegExpExecArray | null;
    const strippedText = removeCodeBlocks(text);
    const re = new RegExp(TAG_RE.source, TAG_RE.flags);

    while ((match = re.exec(strippedText)) !== null) {
        const tag = match[1].trim();
        if (tag) results.push(tag);
    }

    return results;
}

function extractFrontmatterTags(fm: Record<string, unknown>): string[] {
    const results: string[] = [];

    // Handle YAML tags array
    if (Array.isArray(fm.tags)) {
        for (const t of fm.tags) {
            if (typeof t === "string") results.push(t.replace(/^#/, ""));
        }
    } else if (typeof fm.tags === "string") {
        // Sometimes tags is a comma-separated string
        results.push(
            ...fm.tags
                .split(",")
                .map((t: string) => t.trim().replace(/^#/, ""))
                .filter(Boolean),
        );
    }

    // Also handle "tag" field
    if (Array.isArray(fm.tag)) {
        for (const t of fm.tag) {
            if (typeof t === "string") results.push(t.replace(/^#/, ""));
        }
    }

    return results;
}

// ---------------------------------------------------------------------------
// Tag graph building
// ---------------------------------------------------------------------------

function processTag(
    tag: string,
    noteId: string,
    tagMode: "flat" | "hierarchical",
    nodeMap: Map<string, GraphNode>,
    links: GraphLink[],
) {
    if (tagMode === "flat") {
        const tagId = `tag:${tag}`;
        if (!nodeMap.has(tagId)) {
            nodeMap.set(tagId, {
                id: tagId,
                name: `#${tag}`,
                type: "tag",
                val: 1,
            });
        }
        links.push({ source: noteId, target: tagId, type: "tag" });
    } else {
        // Hierarchical: #physics/em -> nodes "em" and "physics", with em -> physics edge
        const parts = tag.split("/");

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const tagId = `tag:${part}`;

            if (!nodeMap.has(tagId)) {
                nodeMap.set(tagId, {
                    id: tagId,
                    name: `#${part}`,
                    type: "tag",
                    val: 1,
                });
            }

            // Link the note to the leaf (deepest) tag
            if (i === parts.length - 1) {
                links.push({ source: noteId, target: tagId, type: "tag" });
            }

            // Link child -> parent
            if (i > 0) {
                const parentId = `tag:${parts[i - 1]}`;
                // Avoid duplicate hierarchy links
                const exists = links.some(
                    (l) =>
                        l.type === "tag-hierarchy" &&
                        l.source === tagId &&
                        l.target === parentId,
                );
                if (!exists) {
                    links.push({
                        source: tagId,
                        target: parentId,
                        type: "tag-hierarchy",
                    });
                }
            }
        }
    }
}
