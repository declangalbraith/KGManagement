import type { CommunityNode, EntityNode, RelationNode, SchemaWorkbenchSnapshot } from './types';

export function cloneWorkbenchSnapshot(
	communities: CommunityNode[],
	entities: EntityNode[],
	relations: RelationNode[]
): SchemaWorkbenchSnapshot {
	return {
		communities: JSON.parse(JSON.stringify(communities)),
		entities: JSON.parse(JSON.stringify(entities)),
		relations: JSON.parse(JSON.stringify(relations)),
	};
}

export function formatSchemaSavedTime(date: Date): string {
	const now = new Date();
	const isToday =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate();
	const hh = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	if (isToday) {
		return `今天 ${hh}:${mm}`;
	}
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day} ${hh}:${mm}`;
}
