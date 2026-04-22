import { json, error } from "@sveltejs/kit";
import { stat } from "node:fs/promises";
import { parseVault } from "$lib/server/vault-parser.js";
import type { VaultConfig } from "$lib/types.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ url }) => {
  const vaultPath = url.searchParams.get("vault");
  const linkMode =
    (url.searchParams.get("linkMode") as VaultConfig["linkMode"]) || "auto";
  const tagMode =
    (url.searchParams.get("tagMode") as VaultConfig["tagMode"]) || "flat";

  if (!vaultPath) {
    throw error(400, 'Missing required "vault" query parameter');
  }

  // Validate that the vault path exists and is a directory
  try {
    const s = await stat(vaultPath);
    if (!s.isDirectory()) {
      throw error(400, `Path "${vaultPath}" is not a directory`);
    }
  } catch (e: unknown) {
    if (e && typeof e === "object" && "status" in e) throw e; // re-throw SvelteKit errors
    throw error(400, `Cannot access path "${vaultPath}". Make sure it exists.`);
  }

  const config: VaultConfig = { vaultPath, linkMode, tagMode };

  try {
    const graphData = await parseVault(config);
    return json(graphData);
  } catch (e: unknown) {
    console.error("Vault parse error:", e);
    throw error(500, "Failed to parse vault");
  }
};
