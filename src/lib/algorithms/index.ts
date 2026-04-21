import { CoCitationAlgorithm } from './local/co-citation.js';
import { AdamicAdarAlgorithm } from './local/adamic-adar.js';
import { JaccardAlgorithm } from './local/jaccard.js';
import { OverlapAlgorithm } from './local/overlap.js';
import { ClusteringCoefficientAlgorithm } from './local/clustering-coefficient.js';

import { LouvainAlgorithm } from './global/louvain.js';
import { LabelPropagationAlgorithm } from './global/label-propagation.js';
import { KCoreAlgorithm } from './global/k-core.js';
import { HITSAlgorithm } from './global/hits.js';

export const LOCAL_ALGORITHMS = [
	CoCitationAlgorithm,
	AdamicAdarAlgorithm,
	JaccardAlgorithm,
	OverlapAlgorithm,
	ClusteringCoefficientAlgorithm
];

export const GLOBAL_ALGORITHMS = [
	LouvainAlgorithm,
	LabelPropagationAlgorithm,
	KCoreAlgorithm,
	HITSAlgorithm
];

export {
	CoCitationAlgorithm,
	AdamicAdarAlgorithm,
	JaccardAlgorithm,
	OverlapAlgorithm,
	ClusteringCoefficientAlgorithm,
	LouvainAlgorithm,
	LabelPropagationAlgorithm,
	KCoreAlgorithm,
	HITSAlgorithm
};
