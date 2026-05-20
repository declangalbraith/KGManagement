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
					<label class="kg-field"><span>{{ t('message.pages.schema.communityName') }}</span><input :value="community.name" readonly /></label>
					<label class="kg-field"><span>{{ t('message.pages.schema.nameEn') }}</span><input class="mono" :value="community.nameEn" readonly /></label>
					<label class="kg-field"><span>{{ t('message.pages.schema.domain') }}</span><input :value="community.domain" readonly /></label>
					<label class="kg-field"><span>{{ t('message.pages.schema.communityDesc') }}</span><textarea :value="community.desc" readonly rows="3" /></label>
				</section>
				<section>
					<h4>{{ t('message.pages.schema.collab') }}</h4>
					<div class="kg-schema-panel__grid2">
						<div><span>{{ t('message.pages.schema.activeMembers') }}</span><strong>{{ community.members }}</strong></div>
						<div><span>{{ t('message.pages.schema.owner') }}</span><strong class="is-primary">{{ community.owner }}</strong></div>
					</div>
					<button type="button" class="kg-schema-panel__btn-outline">{{ t('message.pages.schema.configPerm') }}</button>
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
					<label class="kg-field"><span>{{ t('message.pages.schema.zhName') }}</span><input :value="entity.name" readonly /></label>
					<div class="kg-field-row">
						<label class="kg-field"><span>{{ t('message.pages.schema.enName') }}</span><input class="mono" :value="entity.nameEn" readonly /></label>
						<label class="kg-field"><span>{{ t('message.pages.schema.domain') }}</span><input :value="entity.domain" readonly /></label>
					</div>
					<label class="kg-field"><span>{{ t('message.pages.schema.uniqueId') }}</span><input class="mono is-disabled" :value="entity.id" disabled /></label>
				</section>
				<hr />
				<section>
					<h4>{{ t('message.pages.schema.communityMap') }}</h4>
					<div class="kg-schema-panel__tags">
						<span v-for="cId in entity.communities" :key="cId" class="kg-tag is-indigo">
							{{ communityName(cId) }}
							<el-icon><Close /></el-icon>
						</span>
						<button type="button" class="kg-tag-add">+ {{ t('message.pages.schema.addMapping') }}</button>
					</div>
				</section>
				<hr />
				<section>
					<div class="kg-schema-panel__sec-head">
						<h4>{{ t('message.pages.schema.metaProps') }}</h4>
						<button type="button" class="kg-icon-sm"><el-icon><Plus /></el-icon></button>
					</div>
					<div v-for="(prop, i) in entity.properties" :key="i" class="kg-prop-card">
						<div class="kg-prop-card__top">
							<strong>{{ prop.name }}</strong>
							<button type="button" class="kg-icon-sm is-danger"><el-icon><Delete /></el-icon></button>
						</div>
						<span class="kg-type-badge">{{ prop.type }}</span>
						<span v-if="prop.required" class="kg-required">{{ t('message.pages.schema.required') }}</span>
						<span v-else class="kg-optional">{{ t('message.pages.schema.optional') }}</span>
					</div>
				</section>
				<hr />
				<section>
					<h4>{{ t('message.pages.schema.impactWarn') }}</h4>
					<div class="kg-impact" :class="entity.impact.risk === 'High' ? 'is-high' : 'is-medium'">
						<el-icon><WarningFilled /></el-icon>
						<div>
							<p class="kg-impact__title">{{ t('message.pages.schema.impactHighTitle') }}</p>
							<p class="kg-impact__text">
								{{ t('message.pages.schema.impactEntityText', { instances: entity.impact.instances.toLocaleString(), models: entity.impact.models }) }}
							</p>
							<button type="button" class="kg-impact__link">{{ t('message.pages.schema.expandImpact') }}</button>
						</div>
					</div>
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
					<div class="kg-conn-box">
						<div class="kg-conn-box__labels"><span>{{ t('message.pages.schema.sourceType') }}</span><span>{{ t('message.pages.schema.targetType') }}</span></div>
						<div class="kg-conn-box__nodes">
							<span>{{ entityName(relation.sourceId) }}</span>
							<el-icon><Right /></el-icon>
							<span>{{ entityName(relation.targetId) }}</span>
						</div>
					</div>
					<label class="kg-field"><span>{{ t('message.pages.schema.relationName') }}</span><input :value="relation.name" readonly /></label>
					<div class="kg-field-row">
						<label class="kg-field"><span>{{ t('message.pages.schema.semanticEn') }}</span><input class="mono is-blue" :value="relation.nameEn" readonly /></label>
						<label class="kg-field"><span>{{ t('message.pages.schema.relationId') }}</span><input class="mono is-disabled" :value="relation.id" disabled /></label>
					</div>
				</section>
				<hr />
				<section>
					<h4>{{ t('message.pages.schema.semanticRules') }}</h4>
					<textarea :value="relation.semantics.desc" readonly rows="2" />
					<div class="kg-rules-grid">
						<div><span>{{ t('message.pages.schema.multiValue') }}</span><el-icon v-if="relation.semantics.multiValue" class="is-ok"><Check /></el-icon><el-icon v-else><Close /></el-icon></div>
						<div><span>{{ t('message.pages.schema.inverse') }}</span><el-icon v-if="relation.semantics.inverse" class="is-ok"><Check /></el-icon><el-icon v-else><Close /></el-icon></div>
						<div><span>{{ t('message.pages.schema.requiredRule') }}</span><el-icon v-if="relation.semantics.required" class="is-ok"><Check /></el-icon><el-icon v-else><Close /></el-icon></div>
					</div>
				</section>
				<hr />
				<section>
					<h4>{{ t('message.pages.schema.usageImpact') }}</h4>
					<div class="kg-schema-panel__tags">
						<span v-for="cId in relation.usage.communities" :key="cId" class="kg-tag">{{ communityName(cId) }}</span>
					</div>
					<div class="kg-impact" :class="relation.impact.risk === 'High' ? 'is-high' : 'is-medium'">
						<el-icon><WarningFilled /></el-icon>
						<div>
							<p class="kg-impact__title">{{ t('message.pages.schema.relationImpactTitle') }}</p>
							<p class="kg-impact__text">
								{{ t('message.pages.schema.impactRelationText', { instances: relation.impact.instances.toLocaleString(), models: relation.impact.models }) }}
							</p>
						</div>
					</div>
				</section>
			</div>
		</template>
	</aside>
</template>

<script setup lang="ts" name="SchemaConfigPanel">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Box, Check, Close, Delete, Plus, Right, Share, User, WarningFilled } from '@element-plus/icons-vue';
import type { SelectionType } from '../types';
import { mockCommunities, mockEntities, mockRelations } from '../mock';

const props = defineProps<{ selection: SelectionType }>();
const { t } = useI18n();

const community = computed(() =>
	props.selection?.type === 'Community' ? mockCommunities.find((c) => c.id === props.selection!.id) : null
);
const entity = computed(() =>
	props.selection?.type === 'Entity' ? mockEntities.find((e) => e.id === props.selection!.id) : null
);
const relation = computed(() =>
	props.selection?.type === 'Relation' ? mockRelations.find((r) => r.id === props.selection!.id) : null
);

function communityName(id: string) {
	return mockCommunities.find((c) => c.id === id)?.name ?? id;
}
function entityName(id: string) {
	return mockEntities.find((e) => e.id === id)?.name ?? id;
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
.kg-schema-panel__btn-outline {
	width: 100%;
	height: 32px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 12px;
	cursor: pointer;
	&:hover {
		border-color: var(--el-color-primary);
		color: var(--el-color-primary);
	}
}
.kg-schema-panel__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
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
.kg-tag-add {
	font-size: 10px;
	padding: 2px 8px;
	border: 1px dashed #cbd5e1;
	border-radius: 4px;
	background: transparent;
	cursor: pointer;
	color: #64748b;
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
	&:hover {
		background: #f1f5f9;
	}
}
.kg-prop-card__top {
	display: flex;
	justify-content: space-between;
	margin-bottom: 6px;
}
.kg-type-badge {
	font-size: 10px;
	font-family: ui-monospace, monospace;
	padding: 2px 6px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	background: #fff;
	margin-right: 6px;
}
.kg-required {
	font-size: 10px;
	color: #dc2626;
	font-weight: 600;
}
.kg-optional {
	font-size: 10px;
	color: #94a3b8;
}
.kg-impact {
	display: flex;
	gap: 10px;
	padding: 12px;
	border-radius: 8px;
	border: 1px solid;
	font-size: 12px;
	&.is-high {
		background: #fff5f5;
		border-color: #fecaca;
		.el-icon {
			color: #ef4444;
		}
	}
	&.is-medium {
		background: #fffbeb;
		border-color: #fde68a;
		.el-icon {
			color: #f59e0b;
		}
	}
}
.kg-impact__title {
	margin: 0 0 6px;
	font-weight: 600;
	color: #0f172a;
}
.kg-impact__text {
	margin: 0 0 8px;
	color: #475569;
	line-height: 1.5;
}
.kg-impact__link {
	border: none;
	background: none;
	padding: 0;
	font-size: 11px;
	color: #2563eb;
	cursor: pointer;
}
.kg-conn-box {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px;
	margin-bottom: 12px;
}
.kg-conn-box__labels {
	display: flex;
	justify-content: space-between;
	font-size: 11px;
	color: #64748b;
	margin-bottom: 8px;
}
.kg-conn-box__nodes {
	display: flex;
	align-items: center;
	gap: 8px;
	span {
		flex: 1;
		text-align: center;
		font-size: 11px;
		font-weight: 600;
		padding: 6px 8px;
		border: 1px solid #a7f3d0;
		background: #ecfdf5;
		color: #047857;
		border-radius: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
.kg-rules-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	padding: 10px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	font-size: 12px;
	div {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.is-ok {
		color: #059669;
	}
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
	&.is-danger {
		color: #dc2626;
		opacity: 0;
	}
}
.kg-prop-card:hover .kg-icon-sm.is-danger {
	opacity: 1;
}
</style>
