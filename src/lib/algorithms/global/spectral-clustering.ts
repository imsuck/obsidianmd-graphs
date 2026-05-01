import { kmeans } from "ml-kmeans";
import { getSpectralEmbeddings } from "../spectral.js";
import type { GlobalAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph, finalizeCommunityColors } from "../utils.js";

export const SpectralClusteringAlgorithm: GlobalAlgorithm = {
  id: "spectral-clustering",
  name: "Spectral Clustering",
  description:
    "Clusters nodes using eigenvectors of the normalized graph Laplacian. Effective for complex topologies.",
  execute: (data: GraphData, options: { k?: number } = {}) => {
    const k = options.k || 5; 
    const graph = buildGraphologyGraph(data);
    const n = data.nodes.length;

    if (n < k) return finalizeCommunityColors(graph, data, new Map());

    // For spectral clustering, we usually use the first k eigenvectors
    // of the normalized Laplacian. (Including the first one if we use Ng-Jordan-Weiss)
    // Here we use the first k+1 to be safe and skip trivial ones if needed.
    const { embeddings, nodeIds } = getSpectralEmbeddings(data, k + 1);
    
    // Prepare data for k-means: each node is a point in k-dimensional space
    // Standard Spectral Clustering (Ng et al.) uses the first k eigenvectors.
    // We skip the first one if it's strictly constant (eigenvalue 0).
    const startIdx = embeddings[0].eigenvalue < 1e-6 ? 1 : 0;
    const points = nodeIds.map((_, nodeIdx) => {
      const point = [];
      for (let eIdx = startIdx; eIdx < Math.min(startIdx + k, embeddings.length); eIdx++) {
        point.push(embeddings[eIdx].vector[nodeIdx]);
      }
      return point;
    });

    // Normalize rows to unit length (important for Ng-Jordan-Weiss spectral clustering)
    const normalizedPoints = points.map(point => {
      const norm = Math.sqrt(point.reduce((sum, val) => sum + val * val, 0));
      return norm > 0 ? point.map(val => val / norm) : point;
    });

    const result = kmeans(normalizedPoints, k, {});
    
    const labels = new Map<string, number>();
    nodeIds.forEach((id, i) => {
      labels.set(id, result.clusters[i]);
    });

    return finalizeCommunityColors(graph, data, labels);
  },
};
