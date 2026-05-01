import Graph from "graphology";
import type { GraphData } from "../types.js";
import { buildGraphologyGraph } from "./utils.js";

interface Node2VecOptions {
    p: number;
    q: number;
    walkLength: number;
    walksPerNode: number;
    windowSize: number;
    iterations: number;
    learningRate: number;
    negativeSamples: number;
}

/**
 * Generates biased random walks on the graph.
 */
function generateBiasedWalks(
    graph: Graph,
    options: Node2VecOptions,
): string[][] {
    const { p, q, walkLength, walksPerNode } = options;
    const walks: string[][] = [];
    const nodes = graph.nodes();

    for (let i = 0; i < walksPerNode; i++) {
        // Shuffle nodes for better training?
        // For now, just iterate.
        for (const startNode of nodes) {
            const walk: string[] = [startNode];

            let current = startNode;
            let prev: string | null = null;

            for (let step = 1; step < walkLength; step++) {
                const neighbors = graph.neighbors(current);
                if (neighbors.length === 0) break;

                let next: string;
                if (prev === null) {
                    // Simple random walk for the first step
                    next =
                        neighbors[Math.floor(Math.random() * neighbors.length)];
                } else {
                    // Biased transition
                    next = sampleBiasedNeighbor(
                        graph,
                        prev,
                        current,
                        neighbors,
                        p,
                        q,
                    );
                }

                walk.push(next);
                prev = current;
                current = next;
            }
            walks.push(walk);
        }
    }

    return walks;
}

function sampleBiasedNeighbor(
    graph: Graph,
    prev: string,
    current: string,
    neighbors: string[],
    p: number,
    q: number,
): string {
    const weights: number[] = [];
    let totalWeight = 0;

    for (const next of neighbors) {
        let weight: number;
        if (next === prev) {
            weight = 1 / p;
        } else if (graph.hasEdge(prev, next) || graph.hasEdge(next, prev)) {
            weight = 1;
        } else {
            weight = 1 / q;
        }
        weights.push(weight);
        totalWeight += weight;
    }

    let r = Math.random() * totalWeight;
    for (let i = 0; i < neighbors.length; i++) {
        r -= weights[i];
        if (r <= 0) return neighbors[i];
    }

    return neighbors[neighbors.length - 1];
}

/**
 * Trains Node2Vec embeddings using Skip-gram with Negative Sampling (SGNS).
 */
export function trainNode2Vec(
    data: GraphData,
    dim: number = 2,
    options: Partial<Node2VecOptions> = {},
): Map<string, number[]> {
    const graph = buildGraphologyGraph(data);
    const fullOptions: Node2VecOptions = {
        p: 1.0,
        q: 1.0,
        walkLength: 40,
        walksPerNode: 10,
        windowSize: 5,
        iterations: 1,
        learningRate: 0.025,
        negativeSamples: 5,
        ...options,
    };

    const walks = generateBiasedWalks(graph, fullOptions);
    const nodes = graph.nodes();
    const n = nodes.length;
    const nodeToIndex = new Map(nodes.map((id, i) => [id, i]));

    // Initialize embeddings
    // We use two sets of weights for SGNS: target and context
    const targetEmbed = new Float32Array(n * dim);
    const contextEmbed = new Float32Array(n * dim);

    for (let i = 0; i < n * dim; i++) {
        targetEmbed[i] = (Math.random() - 0.5) / dim;
        contextEmbed[i] = (Math.random() - 0.5) / dim;
    }

    let alpha = fullOptions.learningRate;

    for (let iter = 0; iter < fullOptions.iterations; iter++) {
        // Linear decay of learning rate
        alpha = fullOptions.learningRate * (1 - iter / fullOptions.iterations);

        // Optional: Shuffle walks
        for (const walk of walks) {
            for (let i = 0; i < walk.length; i++) {
                const targetId = walk[i];
                const targetIdx = nodeToIndex.get(targetId)!;

                // Context window
                const start = Math.max(0, i - fullOptions.windowSize);
                const end = Math.min(
                    walk.length - 1,
                    i + fullOptions.windowSize,
                );

                for (let j = start; j <= end; j++) {
                    if (i === j) continue;
                    const contextId = walk[j];
                    const contextIdx = nodeToIndex.get(contextId)!;

                    // Positive sample
                    updateSGNS(
                        targetEmbed,
                        contextEmbed,
                        targetIdx,
                        contextIdx,
                        1,
                        alpha,
                        dim,
                        fullOptions.negativeSamples,
                        n,
                    );
                }
            }
        }
        // Decay learning rate?
        // alpha = fullOptions.learningRate * (1 - (iter + 1) / fullOptions.iterations);
    }

    const result = new Map<string, number[]>();
    nodes.forEach((id, i) => {
        const coords = [];
        for (let d = 0; d < dim; d++) {
            coords.push(targetEmbed[i * dim + d]);
        }
        result.set(id, coords);
    });

    return result;
}

function updateSGNS(
    targetEmbed: Float32Array,
    contextEmbed: Float32Array,
    targetIdx: number,
    contextIdx: number,
    label: number,
    alpha: number,
    dim: number,
    negativeSamples: number,
    n: number,
) {
    // Update for positive/negative sample
    const trainStep = (tIdx: number, cIdx: number, lbl: number) => {
        let dot = 0;
        for (let d = 0; d < dim; d++) {
            dot += targetEmbed[tIdx * dim + d] * contextEmbed[cIdx * dim + d];
        }

        const sigmoid = 1 / (1 + Math.exp(-Math.max(-6, Math.min(6, dot))));
        const g = alpha * (lbl - sigmoid);

        for (let d = 0; d < dim; d++) {
            const t = targetEmbed[tIdx * dim + d];
            const c = contextEmbed[cIdx * dim + d];
            targetEmbed[tIdx * dim + d] += g * c;
            contextEmbed[cIdx * dim + d] += g * t;
        }
    };

    // Positive
    trainStep(targetIdx, contextIdx, 1);

    // Negative samples
    for (let s = 0; s < negativeSamples; s++) {
        const negIdx = Math.floor(Math.random() * n);
        if (negIdx !== targetIdx) {
            trainStep(targetIdx, negIdx, 0);
        }
    }
}
