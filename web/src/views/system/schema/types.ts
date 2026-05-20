export type SelectionType = { type: 'Community' | 'Entity' | 'Relation'; id: string } | null;

export interface CommunityNode {
	id: string;
	name: string;
	nameEn: string;
	domain: string;
	members: number;
	desc: string;
	owner: string;
}

export interface EntityNode {
	id: string;
	name: string;
	nameEn: string;
	domain: string;
	communities: string[];
	x: number;
	y: number;
	properties: { name: string; type: string; required: boolean }[];
	impact: { instances: number; models: number; risk: 'Low' | 'Medium' | 'High' };
}

export interface RelationNode {
	id: string;
	name: string;
	nameEn: string;
	sourceId: string;
	targetId: string;
	semantics: { desc: string; multiValue: boolean; required: boolean; inverse: boolean };
	usage: { communities: string[]; instanceCount: number };
	impact: { instances: number; models: number; risk: 'Low' | 'Medium' | 'High' };
}
