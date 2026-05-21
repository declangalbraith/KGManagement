export interface CauseNode {
	id: string;
	text: string;
	isMainCause?: boolean;
	children?: CauseNode[];
}

export interface RcaTool {
	id: string;
	name: string;
	description: string;
}
