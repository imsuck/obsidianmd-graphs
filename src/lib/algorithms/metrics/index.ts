import { DegreeMetric } from "./degree.js";
import { PageRankMetric } from "./pagerank.js";
import { HITSHubsMetric, HITSAuthoritiesMetric } from "./hits.js";
import { EigenvectorMetric } from "./eigenvector.js";

export const METRIC_ALGORITHMS = [
    PageRankMetric,
    DegreeMetric,
    HITSHubsMetric,
    HITSAuthoritiesMetric,
    EigenvectorMetric,
];

export {
    PageRankMetric,
    DegreeMetric,
    HITSHubsMetric,
    HITSAuthoritiesMetric,
    EigenvectorMetric,
};
