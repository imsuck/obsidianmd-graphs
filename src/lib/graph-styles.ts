import type { GraphNode, GraphLink } from "./types";

export interface StyleConfig {
    selectedNode: GraphNode | null;
    globalEnabled: boolean;
    communityRepresentatives: Map<number, GraphNode>;
}

/**
 * Determines the base color for a node based on its type.
 */
export function getNodeBaseColor(node: GraphNode): string {
    if (node.color) return node.color;
    switch (node.type) {
        case "tag":
            return "oklch(0.78 0.18 160)";
        case "unresolved":
            return "oklch(0.55 0.05 250)";
        default:
            return "oklch(0.75 0.14 260)";
    }
}

/**
 * Calculates the opacity for a node based on the selected community.
 */
export function getNodeAlpha(node: GraphNode, config: StyleConfig): number {
    const { selectedNode, globalEnabled } = config;

    // Only highlight if community analysis is on and a community-assigned node is selected
    if (
        !selectedNode ||
        !globalEnabled ||
        selectedNode.community === undefined
    ) {
        return 1.0;
    }

    // Highlight nodes in the same community
    return node.community === selectedNode.community ? 1.0 : 0.2;
}

/**
 * Calculates the opacity for a link based on the selected community.
 */
export function getLinkAlpha(link: any, config: StyleConfig): number {
    const { selectedNode, globalEnabled } = config;

    if (
        !selectedNode ||
        !globalEnabled ||
        selectedNode.community === undefined
    ) {
        return 0.5;
    }

    const source = typeof link.source === "object" ? link.source : null;
    const target = typeof link.target === "object" ? link.target : null;

    if (!source || !target) return 0.5;

    const highlightCommunity = selectedNode.community;
    let alpha = 0.1;
    if (source.community === highlightCommunity) alpha += 0.2;
    if (target.community === highlightCommunity) alpha += 0.2;

    return alpha;
}

/**
 * Formats the tooltip/label for a node.
 */
export function getNodeLabel(node: GraphNode, config: StyleConfig): string {
    const { globalEnabled, communityRepresentatives } = config;
    let label = node.name;

    if (globalEnabled && node.community !== undefined) {
        const rep = communityRepresentatives.get(node.community);
        if (rep && rep.id !== node.id) {
            label = `${rep.name} ￫ ${label}`;
        }
    }

    const typeLabel =
        node.type === "tag"
            ? " (tag)"
            : node.type === "unresolved"
              ? " (unresolved)"
              : "";
    return `${label}${typeLabel}`;
}

/**
 * Determines the display size multiplier for a node.
 */
export function getNodeSize(node: GraphNode): number {
    const base = node.val ?? 1;
    // if (node.type === "tag") return Math.max(base * 0.6, 0.5);
    return base;
}
