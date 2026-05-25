import type { ParsedOpenSpgSchema, ParsedSchemaEntity } from './parseOpenSpgSchema';
import type { CommunityNode, EntityNode, RelationNode } from './types';

export function layoutPosition(index: number, total: number): { x: number; y: number } {
	const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
	const col = index % cols;
	const row = Math.floor(index / cols);
	return { x: 80 + col * 260, y: 80 + row * 160 };
}

function entityToNode(
	entity: ParsedSchemaEntity,
	index: number,
	total: number,
	namespace: string,
	communityId: string
): EntityNode {
	const { x, y } = layoutPosition(index, total);
	const propCount = entity.properties.length;
	const risk: 'Low' | 'Medium' | 'High' =
		propCount >= 6 ? 'High' : propCount >= 3 ? 'Medium' : 'Low';

	return {
		id: entity.nameEn,
		name: entity.nameZh || entity.nameEn,
		nameEn: entity.nameEn,
		domain: namespace,
		communities: [communityId],
		x,
		y,
		properties: entity.properties.map((p) => ({
			name: p.nameZh ? `${p.nameZh} (${p.nameEn})` : p.nameEn,
			type: p.type,
			required: p.constraints.some((c) => c === 'NotNull' || c.includes('NotNull')),
		})),
		impact: { instances: 0, models: 0, risk },
	};
}

export function parsedSchemaToWorkbench(parsed: ParsedOpenSpgSchema): {
	communities: CommunityNode[];
	entities: EntityNode[];
	relations: RelationNode[];
} {
	const communityId = `com-${parsed.namespace}`;
	const communities: CommunityNode[] = [
		{
			id: communityId,
			name: parsed.namespace,
			nameEn: parsed.namespace,
			domain: 'Schema Namespace',
			members: parsed.entities.length,
			desc:
				parsed.entities.find((e) => e.desc)?.desc ??
				`从 .schema 导入的 Namespace「${parsed.namespace}」`,
			owner: 'Schema 导入',
		},
	];

	const entityIdSet = new Set(parsed.entities.map((e) => e.nameEn));
	const entities = parsed.entities.map((e, i) =>
		entityToNode(e, i, parsed.entities.length, parsed.namespace, communityId)
	);

	const relations: RelationNode[] = [];
	let relIndex = 0;
	for (const entity of parsed.entities) {
		for (const rel of entity.relations) {
			if (!entityIdSet.has(rel.targetType)) continue;
			relations.push({
				id: `rel-${entity.nameEn}-${rel.nameEn}-${relIndex++}`,
				name: rel.nameZh || rel.nameEn,
				nameEn: rel.nameEn,
				sourceId: entity.nameEn,
				targetId: rel.targetType,
				semantics: {
					desc: entity.desc
						? `${entity.nameEn}.${rel.nameEn} → ${rel.targetType}`
						: `${entity.nameZh || entity.nameEn} → ${rel.targetType}`,
					multiValue: true,
					required: false,
					inverse: false,
				},
				usage: { communities: [communityId], instanceCount: 0 },
				impact: { instances: 0, models: 0, risk: 'Low' },
			});
		}
	}

	return { communities, entities, relations };
}
