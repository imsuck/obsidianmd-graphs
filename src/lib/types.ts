// Shared types for the graph data model

export type LayoutMode = "force" | "spectral" | "node2vec";

export interface GraphNode {
    id: string;
    name: string;
    type: "note" | "tag" | "unresolved";
    community?: number;
    color?: string;
    val?: number; // node size (proportional to degree)

    // Force-graph simulation properties
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
}

export interface GraphLink {
    source: string;
    target: string;
    type: "wikilink" | "tag" | "tag-hierarchy";
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface VaultConfig {
    vaultPath: string;
    linkMode: "auto" | "absolute" | "relative";
    tagMode: "flat" | "hierarchical";
}

export interface AnalyticsResult {
    nodeId: string;
    nodeName: string;
    nodeType?: "note" | "tag" | "unresolved";
    score: number;
    isLinked?: boolean;
}

export interface LocalAlgorithm {
    id: string;
    name: string;
    description: string;
    execute: (data: GraphData, selectedNodeId: string) => AnalyticsResult[];
}

export interface GlobalAlgorithm {
    id: string;
    name: string;
    description: string;
    execute: (
        data: GraphData,
        options?: any,
    ) => { palette: Map<number, string>; communityCount: number };
}

export interface MetricAlgorithm {
    id: string;
    name: string;
    description: string;
    execute: (data: GraphData, options?: any) => void;
}
