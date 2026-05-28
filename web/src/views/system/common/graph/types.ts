import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3';

/** 展示用类型桶（后端 vizType） */
export type GraphVizType =
	| 'report'
	| 'event'
	| 'cause'
	| 'action'
	| 'product'
	| 'part'
	| 'failure'
	| 'org'
	| 'installation'
	| 'category'
	| 'chunk'
	| 'other';

export interface GraphTypeLegendItem {
	label: string;
	color: string;
	icon: string;
}

export interface GraphNode extends SimulationNodeDatum {
	id: string;
	group: number;
	label: string;
	/** OpenSPG 实体短类型名，如 EightDReport */
	spgType: string;
	/** 图例/配色桶 */
	vizType: GraphVizType | string;
	properties?: Record<string, unknown>;
	/** @deprecated 仅 mock 演示字段 */
	occurrences?: number;
	/** @deprecated 仅 mock 演示字段 */
	confidence?: number;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
	source: string | GraphNode;
	target: string | GraphNode;
	label: string;
}
