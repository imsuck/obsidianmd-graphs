import { trainNode2Vec } from "../algorithms/node2vec.js";
import type { GraphData } from "../types.js";

/**
 * Applies Node2Vec layout to the graph data.
 */
export function applyNode2VecLayout(
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
  } = {}
) {
  const { 
    scale = 1.0, 
    aspectRatio = 1.0, 
    p = 1.0, 
    q = 1.0, 
    iterations = 5, 
    walkLength = 20 
  } = options;
  
  const n = data.nodes.length;
  if (n === 0) return data;

  // We train in 2D directly for layout purposes
  const embeddings = trainNode2Vec(data, 2, {
    p,
    q,
    iterations,
    walkLength,
    walksPerNode: 5, // Keep it relatively fast
  });

  const nodePositions = new Map<string, { x: number; y: number }>();

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  embeddings.forEach((coords, id) => {
    const x = coords[0];
    const y = coords[1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  const rangeX = (maxX - minX) > 1e-6 ? (maxX - minX) : 1;
  const rangeY = (maxY - minY) > 1e-6 ? (maxY - minY) : 1;

  const padding = 100;
  const drawWidth = (width - padding * 2) * scale;
  const drawHeight = (height - padding * 2) * scale;

  embeddings.forEach((coords, id) => {
    const normX = (coords[0] - minX) / rangeX;
    const normY = (coords[1] - minY) / rangeY;

    const jitter = (Math.random() - 0.5) * 5;

    nodePositions.set(id, {
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
