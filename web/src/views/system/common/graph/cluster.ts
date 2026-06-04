import type { GraphLink, GraphNode } from './types';

/** Default overview: single cluster cap */
export const MAX_CLUSTER_NODES = 40;
/** Builder page loads a wider overview for merge preview */
export const BUILDER_OVERVIEW_LIMIT = 80;
/** QA highlight cluster cap (multi-hop BFS) */
export const HIGHLIGHT_CLUSTER_MAX_NODES = 40;

function linkId(link: GraphLink): { source: string; target: string } {
	const source = typeof link.source === 'string' ? link.source : link.source.id;
	const target = typeof link.target === 'string' ? link.target : link.target.id;
	return { source, target };
}

function pickSeeds(nodes: GraphNode[], seedIds?: string[] | null): string[] {
	const nodeIds = new Set(nodes.map((n) => n.id));
	const seeds = (seedIds || []).filter((id) => nodeIds.has(id));
	if (seeds.length) return seeds;
	const report = nodes.find(
		(n) => n.vizType === 'report' || n.spgType.endsWith('EightDReport') || n.spgType === 'EightDReport',
	);
	if (report) return [report.id];
	return nodes.length ? [nodes[0].id] : [];
}

function bfsCluster(
	adj: Map<string, Set<string>>,
	allIds: Set<string>,
	starts: string[],
	maxNodes: number,
): Set<string> {
	const visited = new Set<string>();
	const queue: string[] = starts.filter((id) => allIds.has(id));
	const unlimited = maxNodes <= 0;
	while (queue.length && (unlimited || visited.size < maxNodes)) {
		const nid = queue.shift()!;
		if (visited.has(nid)) continue;
		visited.add(nid);
		for (const nb of adj.get(nid) || []) {
			if (!visited.has(nb) && (unlimited || visited.size < maxNodes)) queue.push(nb);
		}
	}
	return visited;
}

/**
 * Keep one connected cluster (BFS from seeds or first report). maxNodes<=0 = full cluster.
 * Do not use for multi-document overview — disjoint report subgraphs need applyMergedOverviewGraph (QA page).
 */
export function focusGraphCluster(
	nodes: GraphNode[],
	links: GraphLink[],
	seedIds?: string[] | null,
	maxNodes: number = MAX_CLUSTER_NODES,
): { nodes: GraphNode[]; links: GraphLink[] } {
	if (!nodes.length) return { nodes: [], links: [] };

	const adj = new Map<string, Set<string>>();
	for (const link of links) {
		const { source, target } = linkId(link);
		if (!adj.has(source)) adj.set(source, new Set());
		if (!adj.has(target)) adj.set(target, new Set());
		adj.get(source)!.add(target);
		adj.get(target)!.add(source);
	}

	const nodeById = new Map(nodes.map((n) => [n.id, n]));
	const allIds = new Set(nodeById.keys());
	const seeds = pickSeeds(nodes, seedIds);

	let cluster: Set<string>;
	if (seedIds?.length) {
		const seedSet = new Set(seedIds);
		let best = bfsCluster(adj, allIds, seeds, maxNodes);
		let bestHit = [...best].filter((id) => seedSet.has(id)).length;
		for (const sid of seeds) {
			const comp = bfsCluster(adj, allIds, [sid], maxNodes);
			const hit = [...comp].filter((id) => seedSet.has(id)).length;
			if (hit > bestHit || (hit === bestHit && comp.size > best.size)) {
				best = comp;
				bestHit = hit;
			}
		}
		cluster = best;
	} else {
		cluster = bfsCluster(adj, allIds, seeds, maxNodes);
	}

	const fnodes = [...cluster].map((id) => nodeById.get(id)!).filter(Boolean);
	const flinks = links.filter((l) => {
		const { source, target } = linkId(l);
		return cluster.has(source) && cluster.has(target);
	});
	return { nodes: fnodes, links: flinks };
}
