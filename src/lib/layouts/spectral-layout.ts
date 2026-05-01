import { getSpectralEmbeddings } from "../algorithms/spectral.js";
import type { GraphData } from "../types.js";

/**
 * Applies spectral layout to the graph data.
 * Uses the first two non-zero eigenvectors for x and y coordinates.
 */
export function applySpectralLayout(
    data: GraphData,
    width: number,
    height: number,
    options: { scale?: number; aspectRatio?: number } = {},
) {
    const { scale = 1.0, aspectRatio = 1.0 } = options;
    const n = data.nodes.length;
    if (n === 0) return data;

    // Fetch more eigenvectors to skip zeros
    const { embeddings, nodeIds } = getSpectralEmbeddings(
        data,
        Math.min(n, 10),
    );

    if (embeddings.length < 2) return data;

    const validEmbeddings = embeddings.filter((e) => e.eigenvalue > 0.001);

    let xVec, yVec;
    if (validEmbeddings.length >= 2) {
        xVec = validEmbeddings[0].vector;
        yVec = validEmbeddings[1].vector;
    } else if (validEmbeddings.length === 1) {
        xVec = validEmbeddings[0].vector;
        yVec = embeddings[0].vector;
    } else {
        xVec = embeddings[Math.min(1, embeddings.length - 1)].vector;
        yVec =
            embeddings[
                Math.min(
                    Math.max(1, embeddings.length - 1),
                    embeddings.length - 1,
                )
            ].vector;
    }

    const nodePositions = new Map<string, { x: number; y: number }>();

    let minX = Infinity,
        maxX = -Infinity;
    let minY = Infinity,
        maxY = -Infinity;

    nodeIds.forEach((id, i) => {
        const x = xVec[i];
        const y = yVec[i];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    });

    const rangeX = maxX - minX > 1e-6 ? maxX - minX : 1;
    const rangeY = maxY - minY > 1e-6 ? maxY - minY : 1;

    const padding = 100;
    const drawWidth = (width - padding * 2) * scale;
    const drawHeight = (height - padding * 2) * scale;

    nodeIds.forEach((id, i) => {
        const normX = (xVec[i] - minX) / rangeX;
        const normY = (yVec[i] - minY) / rangeY;

        const jitter = (Math.random() - 0.5) * 5;

        nodePositions.set(id, {
            // Apply aspect ratio: multiply x or y by a factor
            x: (normX - 0.5) * drawWidth * aspectRatio + jitter,
            y: (normY - 0.5) * drawHeight + jitter,
        });
    });

    data.nodes.forEach((node) => {
        const pos = nodePositions.get(node.id);
        if (pos) {
            node.fx = pos.x;
            node.fy = pos.y;
        }
    });

    return data;
}
