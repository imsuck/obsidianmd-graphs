import { browser } from "$app/environment";
import { GLOBAL_ALGORITHMS, METRIC_ALGORITHMS } from "./analytics.js";
import type { LayoutMode } from "./types.js";

export class Settings {
    vaultPath = $state("");
    linkMode = $state<"auto" | "absolute" | "relative">("auto");
    tagMode = $state<"flat" | "hierarchical">("flat");
    globalAlgorithmId = $state(GLOBAL_ALGORITHMS[0].id);
    louvainResolution = $state(1.0);
    spectralK = $state(5);
    spectralScale = $state(1.0);
    spectralAspectRatio = $state(1.0);
    node2vecP = $state(1.0);
    node2vecQ = $state(1.0);
    node2vecIterations = $state(5);
    node2vecWalkLength = $state(20);
    metricId = $state(METRIC_ALGORITHMS[0].id);
    layoutMode = $state<LayoutMode>("force");
    showArrows = $state(true);
    blendCommunities = $state(false);
    collapsed = $state(false);
    activeTab = $state<"project" | "analytics">("project");

    constructor() {
        if (browser) {
            this.load();
        }
    }

    load() {
        const saved = localStorage.getItem("obsidian-graph-settings");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Safely apply saved settings
                if (data.vaultPath !== undefined)
                    this.vaultPath = data.vaultPath;
                if (data.linkMode !== undefined) this.linkMode = data.linkMode;
                if (data.tagMode !== undefined) this.tagMode = data.tagMode;
                if (data.globalAlgorithmId !== undefined)
                    this.globalAlgorithmId = data.globalAlgorithmId;
                if (data.louvainResolution !== undefined)
                    this.louvainResolution = data.louvainResolution;
                if (data.spectralK !== undefined)
                    this.spectralK = data.spectralK;
                if (data.spectralScale !== undefined)
                    this.spectralScale = data.spectralScale;
                if (data.spectralAspectRatio !== undefined)
                    this.spectralAspectRatio = data.spectralAspectRatio;
                if (data.node2vecP !== undefined)
                    this.node2vecP = data.node2vecP;
                if (data.node2vecQ !== undefined)
                    this.node2vecQ = data.node2vecQ;
                if (data.node2vecIterations !== undefined)
                    this.node2vecIterations = data.node2vecIterations;
                if (data.node2vecWalkLength !== undefined)
                    this.node2vecWalkLength = data.node2vecWalkLength;
                if (data.metricId !== undefined) this.metricId = data.metricId;
                if (data.layoutMode !== undefined)
                    this.layoutMode = data.layoutMode;
                if (data.showArrows !== undefined)
                    this.showArrows = data.showArrows;
                if (data.blendCommunities !== undefined)
                    this.blendCommunities = data.blendCommunities;
                if (data.collapsed !== undefined)
                    this.collapsed = data.collapsed;
                if (data.activeTab !== undefined)
                    this.activeTab = data.activeTab;
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        }
    }

    save() {
        if (!browser) return;
        const data = {
            vaultPath: this.vaultPath,
            linkMode: this.linkMode,
            tagMode: this.tagMode,
            globalAlgorithmId: this.globalAlgorithmId,
            louvainResolution: this.louvainResolution,
            spectralK: this.spectralK,
            spectralScale: this.spectralScale,
            spectralAspectRatio: this.spectralAspectRatio,
            node2vecP: this.node2vecP,
            node2vecQ: this.node2vecQ,
            node2vecIterations: this.node2vecIterations,
            node2vecWalkLength: this.node2vecWalkLength,
            metricId: this.metricId,
            layoutMode: this.layoutMode,
            showArrows: this.showArrows,
            blendCommunities: this.blendCommunities,
            collapsed: this.collapsed,
            activeTab: this.activeTab,
        };
        localStorage.setItem("obsidian-graph-settings", JSON.stringify(data));
    }
}

export const settings = new Settings();
