<template>
	<aside v-if="selection" class="kg-schema-panel">
		<!-- Community -->
		<template v-if="selection.type === 'Community' && community">
			<div class="kg-schema-panel__head">
				<span><el-icon class="is-indigo"><User /></el-icon> {{ t('message.pages.schema.communityDetail') }}</span>
				<span class="kg-schema-panel__badge is-indigo">Community Selected</span>
			</div>
			<div class="kg-schema-panel__body">
				<section>
					<h4>{{ t('message.pages.schema.basicInfo') }}</h4>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.communityName') }}</span>
						<input :value="community.name" @input="patchCommunity({ name: inputValue($event) })" />
					</label>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.nameEn') }}</span>
						<input class="mono" :value="community.nameEn" @input="patchCommunity({ nameEn: inputValue($event) })" />
					</label>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.domain') }}</span>
						<input :value="community.domain" @input="patchCommunity({ domain: inputValue($event) })" />
					</label>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.communityDesc') }}</span>
						<textarea :value="community.desc" rows="3" @input="patchCommunity({ desc: inputValue($event) })" />
					</label>
				</section>
				<section>
					<h4>{{ t('message.pages.schema.collab') }}</h4>
					<div class="kg-schema-panel__grid2">
						<div><span>{{ t('message.pages.schema.activeMembers') }}</span><strong>{{ community.members }}</strong></div>
						<div><span>{{ t('message.pages.schema.owner') }}</span><strong class="is-primary">{{ community.owner }}</strong></div>
					</div>
				</section>
			</div>
		</template>

		<!-- Entity -->
		<template v-else-if="selection.type === 'Entity' && entity">
			<div class="kg-schema-panel__head">
				<span><el-icon class="is-green"><Box /></el-icon> {{ t('message.pages.schema.entityConfig') }}</span>
				<span class="kg-schema-panel__badge is-green">Entity Selected</span>
			</div>
			<div class="kg-schema-panel__body">
				<section>
					<h4>{{ t('message.pages.schema.basicProps') }}</h4>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.zhName') }}</span>
						<input :value="entity.name" @input="patchEntity({ name: inputValue($event) })" />
					</label>
					<div class="kg-field-row">
						<label class="kg-field">
							<span>{{ t('message.pages.schema.enName') }}</span>
							<input class="mono" :value="entity.nameEn" @input="patchEntity({ nameEn: inputValue($event) })" />
						</label>
						<label class="kg-field">
							<span>{{ t('message.pages.schema.domain') }}</span>
							<input :value="entity.domain" @input="patchEntity({ domain: inputValue($event) })" />
						</label>
					</div>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.uniqueId') }}</span>
						<input class="mono is-disabled" :value="entity.id" disabled />
					</label>
				</section>
				<hr />
				<section>
					<h4>{{ t('message.pages.schema.communityMap') }}</h4>
					<div class="kg-schema-panel__tags">
						<span v-for="cId in entity.communities" :key="cId" class="kg-tag is-indigo">
							{{ communityName(cId) }}
							<button type="button" class="kg-tag-remove" @click="removeEntityCommunity(cId)">
								<el-icon><Close /></el-icon>
							</button>
						</span>
					</div>
					<el-select
						v-if="availableCommunitiesForEntity.length"
						:key="communitySelectKey"
						class="kg-community-select"
						:placeholder="t('message.pages.schema.addMapping')"
						size="small"
						:model-value="''"
						@change="onAddEntityCommunity"
					>
						<el-option
							v-for="c in availableCommunitiesForEntity"
							:key="c.id"
							:label="c.name"
							:value="c.id"
						/>
					</el-select>
				</section>
				<hr />
				<section>
					<div class="kg-schema-panel__sec-head">
						<h4>{{ t('message.pages.schema.metaProps') }}</h4>
						<button type="button" class="kg-icon-sm" :title="t('message.pages.schema.addProperty')" @click="emit('add-entity-property', entity.id)">
							<el-icon><Plus /></el-icon>
						</button>
					</div>
					<div v-for="(prop, i) in entity.properties" :key="i" class="kg-prop-card">
						<div class="kg-prop-card__top">
							<input
								class="kg-prop-name-input"
								:value="prop.name"
								:placeholder="t('message.pages.schema.propName')"
								@input="emit('update-entity-property', entity.id, i, { name: inputValue($event) })"
							/>
							<button
								type="button"
								class="kg-icon-sm is-danger"
								:title="t('message.pages.schema.deleteProperty')"
								@click="emit('remove-entity-property', entity.id, i)"
							>
								<el-icon><Delete /></el-icon>
							</button>
						</div>
						<div class="kg-prop-card__row">
							<el-select
								:model-value="prop.type"
								size="small"
								class="kg-prop-type-select"
								@change="emit('update-entity-property', entity.id, i, { type: $event as string })"
							>
								<el-option v-for="pt in propertyTypes" :key="pt" :label="pt" :value="pt" />
							</el-select>
							<label class="kg-prop-required">
								<input
									type="checkbox"
									:checked="prop.required"
									@change="emit('update-entity-property', entity.id, i, { required: ($event.target as HTMLInputElement).checked })"
								/>
								{{ t('message.pages.schema.required') }}
							</label>
						</div>
					</div>
					<p v-if="!entity.properties.length" class="kg-empty-hint">{{ t('message.pages.schema.noProperties') }}</p>
				</section>
			</div>
		</template>

		<!-- Relation -->
		<template v-else-if="selection.type === 'Relation' && relation">
			<div class="kg-schema-panel__head">
				<span><el-icon class="is-blue"><Share /></el-icon> {{ t('message.pages.schema.relationConfig') }}</span>
				<span class="kg-schema-panel__badge is-blue">Relation Selected</span>
			</div>
			<div class="kg-schema-panel__body">
				<section>
					<h4>{{ t('message.pages.schema.connectionDef') }}</h4>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.sourceType') }}</span>
						<el-select :model-value="relation.sourceId" class="kg-full-select" @change="patchRelation({ sourceId: $event as string })">
							<el-option v-for="e in entities" :key="e.id" :label="e.name" :value="e.id" />
						</el-select>
					</label>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.targetType') }}</span>
						<el-select :model-value="relation.targetId" class="kg-full-select" @change="patchRelation({ targetId: $event as string })">
							<el-option v-for="e in entities" :key="e.id" :label="e.name" :value="e.id" />
						</el-select>
					</label>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.relationName') }}</span>
						<input :value="relation.name" @input="patchRelation({ name: inputValue($event) })" />
					</label>
					<div class="kg-field-row">
						<label class="kg-field">
							<span>{{ t('message.pages.schema.semanticEn') }}</span>
							<input class="mono is-blue" :value="relation.nameEn" @input="patchRelation({ nameEn: inputValue($event) })" />
						</label>
						<label class="kg-field">
							<span>{{ t('message.pages.schema.relationId') }}</span>
							<input class="mono is-disabled" :value="relation.id" disabled />
						</label>
					</div>
				</section>
				<hr />
				<section>
					<h4>{{ t('message.pages.schema.semanticRules') }}</h4>
					<label class="kg-field">
						<span>{{ t('message.pages.schema.semanticDesc') }}</span>
						<textarea
							:value="relation.semantics.desc"
							rows="3"
							@input="patchRelationSemantics({ desc: inputValue($event) })"
						/>
					</label>
					<div class="kg-rules-grid kg-rules-grid--edit">
						<label class="kg-check-row">
							<input
								type="checkbox"
								:checked="relation.semantics.multiValue"
								@change="patchRelationSemantics({ multiValue: ($event.target as HTMLInputElement).checked })"
							/>
							<span>{{ t('message.pages.schema.multiValue') }}</span>
						</label>
						<label class="kg-check-row">
							<input
								type="checkbox"
								:checked="relation.semantics.inverse"
								@change="patchRelationSemantics({ inverse: ($event.target as HTMLInputElement).checked })"
							/>
							<span>{{ t('message.pages.schema.inverse') }}</span>
						</label>
						<label class="kg-check-row">
							<input
								type="checkbox"
								:checked="relation.semantics.required"
								@change="patchRelationSemantics({ required: ($event.target as HTMLInputElement).checked })"
							/>
							<span>{{ t('message.pages.schema.requiredRule') }}</span>
						</label>
					</div>
				</section>
			</div>
		</template>
	</aside>
</template>

<script setup lang="ts" name="SchemaConfigPanel">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Box, Close, Delete, Plus, Share, User } from '@element-plus/icons-vue';
import { PROPERTY_TYPES } from '../schemaEditing';
import type { CommunityNode, EntityNode, RelationNode, SelectionType } from '../types';

const props = defineProps<{
	selection: SelectionType;
	communities: CommunityNode[];
	entities: EntityNode[];
	relations: RelationNode[];
}>();

const emit = defineEmits<{
	'update-community': [id: string, patch: Partial<CommunityNode>];
	'update-entity': [id: string, patch: Partial<EntityNode>];
	'update-relation': [id: string, patch: Partial<RelationNode>];
	'add-entity-property': [entityId: string];
	'update-entity-property': [entityId: string, index: number, patch: Partial<EntityNode['properties'][number]>];
	'remove-entity-property': [entityId: string, index: number];
}>();

const { t } = useI18n();
const propertyTypes = PROPERTY_TYPES;
const communitySelectKey = ref(0);

const community = computed(() =>
	props.selection?.type === 'Community' ? props.communities.find((c) => c.id === props.selection!.id) : null
);
const entity = computed(() =>
	props.selection?.type === 'Entity' ? props.entities.find((e) => e.id === props.selection!.id) : null
);
const relation = computed(() =>
	props.selection?.type === 'Relation' ? props.relations.find((r) => r.id === props.selection!.id) : null
);

const availableCommunitiesForEntity = computed(() => {
	if (!entity.value) return [];
	const linked = new Set(entity.value.communities);
	return props.communities.filter((c) => !linked.has(c.id));
});

function inputValue(e: Event) {
	return (e.target as HTMLInputElement).value;
}

function communityName(id: string) {
	return props.communities.find((c) => c.id === id)?.name ?? id;
}

function patchCommunity(patch: Partial<CommunityNode>) {
	if (community.value) emit('update-community', community.value.id, patch);
}

function patchEntity(patch: Partial<EntityNode>) {
	if (entity.value) emit('update-entity', entity.value.id, patch);
}

function patchRelation(patch: Partial<RelationNode>) {
	if (relation.value) emit('update-relation', relation.value.id, patch);
}

function patchRelationSemantics(patch: Partial<RelationNode['semantics']>) {
	if (!relation.value) return;
	emit('update-relation', relation.value.id, {
		semantics: { ...relation.value.semantics, ...patch },
	});
}

function removeEntityCommunity(cId: string) {
	if (!entity.value) return;
	emit('update-entity', entity.value.id, {
		communities: entity.value.communities.filter((id) => id !== cId),
	});
}

function onAddEntityCommunity(cId: string) {
	if (!entity.value || !cId) return;
	emit('update-entity', entity.value.id, {
		communities: [...entity.value.communities, cId],
	});
	communitySelectKey.value += 1;
}
</script>

<style scoped lang="scss">
.kg-schema-panel {
	width: 360px;
	flex-shrink: 0;
	border-left: 1px solid rgba(0, 0, 0, 0.08);
	background: #fff;
	display: flex;
	flex-direction: column;
	box-shadow: -2px 0 10px rgba(0, 0, 0, 0.02);
	overflow: hidden;
}
.kg-schema-panel__head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: #f8fafc;
	font-size: 13px;
	font-weight: 600;
	gap: 8px;
	.is-indigo {
		color: #4f46e5;
	}
	.is-green {
		color: #059669;
	}
	.is-blue {
		color: #2563eb;
	}
}
.kg-schema-panel__badge {
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 4px;
	border: 1px solid;
	&.is-indigo {
		background: #eef2ff;
		color: #4338ca;
		border-color: #c7d2fe;
	}
	&.is-green {
		background: #ecfdf5;
		color: #047857;
		border-color: #a7f3d0;
	}
	&.is-blue {
		background: #eff6ff;
		color: #1d4ed8;
		border-color: #bfdbfe;
	}
}
.kg-schema-panel__body {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
	section {
		margin-bottom: 4px;
	}
	h4 {
		margin: 0 0 12px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #64748b;
	}
	hr {
		border: none;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		margin: 16px 0;
	}
}
.kg-field {
	display: block;
	margin-bottom: 10px;
	span {
		display: block;
		font-size: 11px;
		color: #64748b;
		margin-bottom: 4px;
	}
	input,
	textarea {
		width: 100%;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 13px;
		outline: none;
		&:focus {
			border-color: #3b82f6;
			box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
		}
		&.mono {
			font-family: ui-monospace, monospace;
		}
		&.is-disabled {
			background: #f1f5f9;
			color: #64748b;
		}
		&.is-blue {
			color: #1d4ed8;
		}
	}
}
.kg-field-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}
.kg-schema-panel__grid2 {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	padding: 12px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	margin-bottom: 10px;
	span {
		font-size: 11px;
		color: #64748b;
	}
	strong {
		display: block;
		font-size: 18px;
		margin-top: 4px;
		&.is-primary {
			font-size: 13px;
			color: var(--el-color-primary);
		}
	}
}
.kg-schema-panel__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 8px;
}
.kg-tag {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	padding: 2px 8px;
	border-radius: 4px;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	&.is-indigo {
		background: #eef2ff;
		color: #4338ca;
		border-color: #c7d2fe;
	}
}
.kg-tag-remove {
	display: inline-flex;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;
	color: inherit;
	opacity: 0.6;
	&:hover {
		opacity: 1;
	}
}
.kg-community-select {
	width: 100%;
}
.kg-full-select {
	width: 100%;
}
.kg-schema-panel__sec-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
	h4 {
		margin: 0;
	}
}
.kg-prop-card {
	padding: 10px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #f8fafc;
	margin-bottom: 8px;
}
.kg-prop-card__top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	margin-bottom: 8px;
}
.kg-prop-name-input {
	flex: 1;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	padding: 4px 8px;
	font-size: 13px;
	font-weight: 600;
}
.kg-prop-card__row {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}
.kg-prop-type-select {
	width: 120px;
}
.kg-prop-required {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	color: #64748b;
	cursor: pointer;
}
.kg-empty-hint {
	font-size: 12px;
	color: #94a3b8;
	margin: 0;
}
.kg-rules-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 8px;
	padding: 10px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	font-size: 12px;
}
.kg-check-row {
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	color: #334155;
}
.kg-icon-sm {
	width: 24px;
	height: 24px;
	border: none;
	background: transparent;
	cursor: pointer;
	border-radius: 4px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}
	&.is-danger {
		color: #dc2626;
	}
}
</style>
