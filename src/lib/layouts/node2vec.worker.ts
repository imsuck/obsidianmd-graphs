import { UMAP } from "umap-js";
import { trainNode2Vec } from "../algorithms/node2vec.js";
import type { GraphData } from "../types.js";

self.onmessage = (e: MessageEvent) => {
    const { data, width, height, options } = e.data;
    const {
        scale = 1.0,
        aspectRatio = 1.0,
        p = 1.0,
        q = 1.0,
        iterations = 5,
        walkLength = 20,
    } = options;

    const n = data.nodes.length;
    if (n === 0) {
        self.postMessage({ nodePositions: new Map() });
        return;
    }

    // 1. Train Node2Vec in higher dimensions
    const highDimEmbeddings = trainNode2Vec(data, 32, {
        p,
        q,
        iterations,
        walkLength,
        walksPerNode: 10,
    });

    // 2. Project to 2D using UMAP
    const ids = Array.from(highDimEmbeddings.keys());
    const embeddingMatrix = ids.map((id) => highDimEmbeddings.get(id)!);

    const umap = new UMAP({
        nComponents: 2,
        nNeighbors: Math.min(n - 1, 15),
        minDist: 0.1,
        spread: 1.0,
    });

    const projection = umap.fit(embeddingMatrix);

    // 3. Normalize and scale
    let minX = Infinity,
        maxX = -Infinity;
    let minY = Infinity,
        maxY = -Infinity;

    for (let i = 0; i < projection.length; i++) {
        const x = projection[i][0];
        const y = projection[i][1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    const rangeX = maxX - minX > 1e-6 ? maxX - minX : 1;
    const rangeY = maxY - minY > 1e-6 ? maxY - minY : 1;

    const padding = 100;
    const drawWidth = (width - padding * 2) * scale;
    const drawHeight = (height - padding * 2) * scale;

    const nodePositions = new Map<string, { x: number; y: number }>();
    ids.forEach((id, i) => {
        const coords = projection[i];
        const normX = (coords[0] - minX) / rangeX;
        const normY = (coords[1] - minY) / rangeY;

        const jitter = (Math.random() - 0.5) * 5;

        nodePositions.set(id, {
            x: (normX - 0.5) * drawWidth * aspectRatio + jitter,
            y: (normY - 0.5) * drawHeight + jitter,
        });
    });

    // We can't send Map over postMessage easily if we want it to be fast/compatible,
    // but in modern browsers it works. However, let's use an object or array for better safety.
    const result: Record<string, { x: number; y: number }> = {};
    nodePositions.forEach((pos, id) => {
        result[id] = pos;
    });

    self.postMessage({ nodePositions: result });
};
