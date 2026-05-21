import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3';

export type GraphNodeType = 'Project' | 'Product' | 'Issue' | 'Component' | 'Cause' | 'Solution' | 'QualityDoc';

export interface GraphNode extends SimulationNodeDatum {
	id: string;
	group: number;
	label: string;
	type: GraphNodeType;
	occurrences?: number;
	confidence?: number;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
	source: string | GraphNode;
	target: string | GraphNode;
	label: string;
}
