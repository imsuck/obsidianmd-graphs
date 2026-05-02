import type { GraphData } from "../types.js";
import Node2VecWorker from "./node2vec.worker.js?worker";

/**
 * Applies Node2Vec layout to the graph data using a Web Worker.
 * Returns a Promise that resolves when the layout is complete.
 */
export async function applyNode2VecLayout(
    data: GraphData,
    width: number,
    height: number,
    options: {
        scale?: number;
        aspectRatio?: number;
        p?: number;
        q?: number;
        iterations?: number;
        walkLength?: number;
    } = {},
): Promise<GraphData> {
    const n = data.nodes.length;
    if (n === 0) return data;

    return new Promise((resolve, reject) => {
        try {
            const worker = new Node2VecWorker();

            worker.postMessage({
                data: {
                    nodes: data.nodes.map((n) => ({ id: n.id })),
                    links: data.links.map((l) => ({
                        source:
                            typeof l.source === "string"
                                ? l.source
                                : l.source.id,
                        target:
                            typeof l.target === "string"
                                ? l.target
                                : l.target.id,
                    })),
                },
                width,
                height,
                options,
            });

            worker.onmessage = (e) => {
                const { nodePositions } = e.data;

                data.nodes.forEach((node) => {
                    const pos = nodePositions[node.id];
                    if (pos) {
                        node.fx = pos.x;
                        node.fy = pos.y;
                    }
                });

                worker.terminate();
                resolve(data);
            };

            worker.onerror = (err) => {
                worker.terminate();
                reject(err);
            };
        } catch (err) {
            reject(err);
        }
    });
}
