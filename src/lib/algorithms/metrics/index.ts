import { DegreeMetric } from './degree.js';
import { PageRankMetric } from './pagerank.js';
import { HITSHubsMetric, HITSAuthoritiesMetric } from './hits.js';
import { EigenvectorMetric } from './eigenvector.js';

export const METRIC_ALGORITHMS = [
	DegreeMetric,
	PageRankMetric,
	HITSHubsMetric,
	HITSAuthoritiesMetric,
	EigenvectorMetric,
];

export {
	DegreeMetric,
	PageRankMetric,
	HITSHubsMetric,
	HITSAuthoritiesMetric,
	EigenvectorMetric,
};
