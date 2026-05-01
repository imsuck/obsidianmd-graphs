import { Matrix, EigenvalueDecomposition } from "ml-matrix";
import type { GraphData } from "../types.js";
import { buildGraphologyGraph } from "./utils.js";

/**
 * Computes the symmetric normalized Laplacian matrix of the graph.
 * L = I - D^(-1/2) * A * D^(-1/2)
 */
export function getLaplacianMatrix(data: GraphData): {
    laplacian: Matrix;
    nodeIds: string[];
} {
    const graph = buildGraphologyGraph(data);
    const nodes = graph.nodes();
    const n = nodes.length;
    const nodeToIndex = new Map(nodes.map((id, i) => [id, i]));

    const L = Matrix.identity(n, n);
    const degrees = nodes.map((node) => graph.neighbors(node).length);

    nodes.forEach((node, i) => {
        const dI = degrees[i];
        if (dI === 0) {
            L.set(i, i, 0);
            return;
        }

        const neighbors = graph.neighbors(node);
        neighbors.forEach((neighbor) => {
            const j = nodeToIndex.get(neighbor);
            if (j !== undefined && i !== j) {
                const dJ = degrees[j];
                if (dJ > 0) {
                    const val = -1 / Math.sqrt(dI * dJ);
                    L.set(i, j, val);
                }
            }
        });
    });

    return { laplacian: L, nodeIds: nodes };
}

/**
 * Computes the eigenvectors of the Laplacian matrix.
 * Returns eigenvectors sorted by their corresponding eigenvalues (ascending).
 */
export function getSpectralEmbeddings(data: GraphData, k: number = 3) {
    const { laplacian, nodeIds } = getLaplacianMatrix(data);

    const evd = new EigenvalueDecomposition(laplacian);
    const realEigenvalues = evd.realEigenvalues;
    const diagonalMatrix = evd.eigenvectorMatrix;

    const indexedEigenvalues = realEigenvalues.map((val, i) => ({ val, i }));

    // Clean up floating point noise near zero
    indexedEigenvalues.forEach((ev) => {
        if (Math.abs(ev.val) < 1e-10) ev.val = 0;
    });

    indexedEigenvalues.sort((a, b) => a.val - b.val);

    const result = [];
    for (let i = 0; i < Math.min(k, indexedEigenvalues.length); i++) {
        const eigenIdx = indexedEigenvalues[i].i;
        const vector = diagonalMatrix.getColumn(eigenIdx);
        result.push({
            eigenvalue: indexedEigenvalues[i].val,
            vector: vector,
        });
    }

    return { embeddings: result, nodeIds };
}
