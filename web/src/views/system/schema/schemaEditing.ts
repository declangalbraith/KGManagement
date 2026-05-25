import type { CommunityNode, EntityNode, RelationNode } from './types';

function layoutPosition(index: number, total: number): { x: number; y: number } {
	const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
	const col = index % cols;
	const row = Math.floor(index / cols);
	return { x: 80 + col * 260, y: 80 + row * 160 };
}

const ID_SAFE_RE = /[^A-Za-z0-9_]/g;

export function sanitizeSchemaId(raw: string): string {
	const trimmed = raw.trim().replace(ID_SAFE_RE, '');
	if (!trimmed) return 'NewItem';
	return /^[0-9]/.test(trimmed) ? `_${trimmed}` : trimmed;
}

export function uniqueSchemaId(base: string, existingIds: Iterable<string>): string {
	const set = new Set(existingIds);
	let id = sanitizeSchemaId(base);
	if (!set.has(id)) return id;
	let n = 1;
	while (set.has(`${id}_${n}`)) n += 1;
	return `${id}_${n}`;
}

export function nextEntityPosition(entityCount: number): { x: number; y: number } {
	return layoutPosition(entityCount, entityCount + 1);
}

export function createEntityNode(
	input: { name: string; nameEn: string; domain: string },
	entities: EntityNode[],
	communities: CommunityNode[]
): EntityNode {
	const id = uniqueSchemaId(
		input.nameEn || input.name,
		entities.map((e) => e.id)
	);
	const { x, y } = nextEntityPosition(entities.length);
	const communityIds = communities.length ? [communities[0].id] : [];

	return {
		id,
		name: input.name.trim() || id,
		nameEn: input.nameEn.trim() || id,
		domain: input.domain.trim() || '默认域',
		communities: communityIds,
		x,
		y,
		properties: [],
		impact: { instances: 0, models: 0, risk: 'Low' },
	};
}

export function createRelationNode(
	input: { name: string; nameEn: string; sourceId: string; targetId: string; desc?: string },
	relations: RelationNode[],
	communities: CommunityNode[]
): RelationNode {
	const nameEn = input.nameEn.trim() || sanitizeSchemaId(input.name);
	const id = uniqueSchemaId(
		`rel_${input.sourceId}_${nameEn}`,
		relations.map((r) => r.id)
	);
	const communityIds = communities.length ? [communities[0].id] : [];

	return {
		id,
		name: input.name.trim() || nameEn,
		nameEn,
		sourceId: input.sourceId,
		targetId: input.targetId,
		semantics: {
			desc: input.desc?.trim() || `${input.sourceId} → ${input.targetId}`,
			multiValue: true,
			required: false,
			inverse: false,
		},
		usage: { communities: communityIds, instanceCount: 0 },
		impact: { instances: 0, models: 0, risk: 'Low' },
	};
}

export const PROPERTY_TYPES = ['Text', 'Number', 'String', 'Enum'] as const;
