import type { GraphSubgraphPayload, GraphTypeLegendItem, GraphVizLink, GraphVizNode } from '/@/api/business/kag';
import type { GraphLink, GraphNode } from './types';

export const FALLBACK_LEGEND: Record<string, GraphTypeLegendItem> = {
	report: { label: '8D Report', color: '#4f46e5', icon: '8D' },
	event: { label: 'Product Event', color: '#ef4444', icon: 'Ev' },
	cause: { label: 'Cause Item', color: '#f59e0b', icon: 'Ca' },
	action: { label: 'Action Item', color: '#10b981', icon: 'Ac' },
	product: { label: 'Product', color: '#06b6d4', icon: 'Pr' },
	part: { label: 'Part', color: '#3b82f6', icon: 'Pt' },
	failure: { label: 'Failure Mode', color: '#dc2626', icon: 'Fm' },
	org: { label: 'Organization', color: '#a855f7', icon: 'Or' },
	installation: { label: 'Installation', color: '#64748b', icon: 'In' },
	category: { label: 'Event Category', color: '#94a3b8', icon: 'Ct' },
	chunk: { label: 'Document Chunk', color: '#cbd5e1', icon: 'Ch' },
	other: { label: 'Other', color: '#9ca3af', icon: 'Ot' },
};

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewNode extends GraphNode {
	origin: 'existing' | 'extract';
	reviewStatus?: ReviewStatus;
}

export interface ReviewLink extends GraphLink {
	id: string;
	origin: 'existing' | 'extract';
	reviewStatus?: ReviewStatus;
}

export function mapApiNode(n: GraphVizNode): GraphNode {
	return {
		id: n.id,
		label: n.label,
		group: n.group,
		spgType: n.spgType,
		vizType: n.vizType,
		properties: n.properties,
	};
}

export function mapApiLink(l: GraphVizLink, index = 0): ReviewLink {
	return {
		id: `link-${l.source}-${l.label}-${l.target}-${index}`,
		source: l.source,
		target: l.target,
		label: l.label,
		origin: 'extract',
		reviewStatus: 'pending',
	};
}

/** Merge overview base graph with freshly extracted subgraph for builder preview. */
export function mergeGraphWithExtract(
	existingNodes: GraphNode[],
	existingLinks: GraphLink[],
	extracted: GraphSubgraphPayload
): {
	nodes: ReviewNode[];
	links: ReviewLink[];
	reviewNodes: ReviewNode[];
	reviewLinks: ReviewLink[];
	typeLegend: Record<string, GraphTypeLegendItem>;
} {
	const existingIds = new Set(existingNodes.map((n) => n.id));
	const nodes: ReviewNode[] = existingNodes.map((n) => ({ ...n, origin: 'existing' as const }));
	const links: ReviewLink[] = existingLinks.map((l, i) => ({
		...l,
		id: `existing-${i}-${String(l.source)}-${String(l.target)}`,
		origin: 'existing' as const,
	}));
	const reviewNodes: ReviewNode[] = [];
	const reviewLinks: ReviewLink[] = [];

	for (const raw of extracted.nodes || []) {
		const mapped = mapApiNode(raw);
		if (existingIds.has(mapped.id)) {
			reviewNodes.push({ ...mapped, origin: 'extract', reviewStatus: 'approved' });
			continue;
		}
		existingIds.add(mapped.id);
		const reviewNode: ReviewNode = { ...mapped, origin: 'extract', reviewStatus: 'pending' };
		nodes.push(reviewNode);
		reviewNodes.push(reviewNode);
	}

	const linkKey = (l: { source: string | GraphNode; target: string | GraphNode; label: string }) =>
		`${String(l.source)}|${l.label}|${String(l.target)}`;
	const seen = new Set(links.map(linkKey));

	(extracted.links || []).forEach((raw, i) => {
		const mapped = mapApiLink(raw, i);
		const key = linkKey(mapped);
		const rev = `${String(mapped.target)}|${mapped.label}|${String(mapped.source)}`;
		if (seen.has(key) || seen.has(rev)) {
			reviewLinks.push({ ...mapped, reviewStatus: 'approved' });
			return;
		}
		seen.add(key);
		const srcKnown = existingIds.has(String(mapped.source));
		const tgtKnown = existingIds.has(String(mapped.target));
		mapped.reviewStatus = srcKnown && tgtKnown ? 'approved' : 'pending';
		links.push(mapped);
		reviewLinks.push(mapped);
	});

	const typeLegend = { ...FALLBACK_LEGEND, ...(extracted.typeLegend || {}) };

	return { nodes, links, reviewNodes, reviewLinks, typeLegend };
}

/** Nodes and links shown in HITL review panel (extract origin only). */
export function extractReviewItems(reviewNodes: ReviewNode[], reviewLinks: ReviewLink[]) {
	return { nodes: reviewNodes, links: reviewLinks };
}

/** Canvas-visible graph after applying review filters. */
export function visibleGraph(nodes: ReviewNode[], links: ReviewLink[]) {
	const activeNodes = nodes.filter((n) => n.origin === 'existing' || n.reviewStatus !== 'rejected');
	const nodeIds = new Set(activeNodes.map((n) => n.id));
	const activeLinks = links.filter(
		(l) =>
			l.origin === 'existing' ||
			(l.reviewStatus !== 'rejected' && nodeIds.has(String(l.source)) && nodeIds.has(String(l.target)))
	);
	return { nodes: activeNodes, links: activeLinks };
}

export function nodeRadius(vizType?: string): number {
	if (vizType === 'report' || vizType === 'product') return 26;
	if (vizType === 'event' || vizType === 'failure') return 24;
	return 20;
}
