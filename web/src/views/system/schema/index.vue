<template>
	<div class="kg-schema">
		<div class="kg-schema__head">
			<div>
				<h1>{{ t('message.pages.schema.title') }}</h1>
				<p>{{ t('message.pages.schema.subtitle') }}</p>
			</div>
			<div>
				<el-button @click="save">{{ t('message.pages.schema.save') }}</el-button>
				<el-button type="primary" @click="publish">{{ t('message.pages.schema.publish') }}</el-button>
			</div>
		</div>
		<el-row :gutter="12" class="kg-schema__body">
			<el-col :span="5">
				<el-card shadow="never" class="kg-schema__side">
					<template #header>{{ t('message.pages.schema.communities') }}</template>
					<div
						v-for="c in mockCommunities"
						:key="c.id"
						class="kg-schema__com"
						:class="{ 'is-active': selection?.type === 'Community' && selection.id === c.id }"
						@click="select({ type: 'Community', id: c.id })"
					>
						<strong>{{ c.name }}</strong>
						<p>{{ c.domain }} · {{ c.members }} 成员</p>
					</div>
					<el-divider />
					<el-input v-model="searchQuery" size="small" :placeholder="t('message.pages.schema.searchPlaceholder')" clearable class="mb-2" />
					<div class="kg-schema__list-title">{{ t('message.pages.schema.entities') }}</div>
					<div
						v-for="e in filteredEntities"
						:key="e.id"
						class="kg-schema__item"
						:class="{ 'is-active': selection?.type === 'Entity' && selection.id === e.id }"
						@click="select({ type: 'Entity', id: e.id })"
					>
						{{ e.name }}
					</div>
					<div class="kg-schema__list-title mt-2">{{ t('message.pages.schema.relations') }}</div>
					<div
						v-for="r in filteredRelations"
						:key="r.id"
						class="kg-schema__item"
						:class="{ 'is-active': selection?.type === 'Relation' && selection.id === r.id }"
						@click="select({ type: 'Relation', id: r.id })"
					>
						{{ r.name }}
					</div>
				</el-card>
			</el-col>
			<el-col :span="13">
				<el-card shadow="never" class="kg-schema__canvas-card">
					<template #header>{{ t('message.pages.schema.canvas') }}</template>
					<div class="kg-schema__canvas">
						<svg class="kg-schema__lines">
							<line
								v-for="rel in mockRelations"
								:key="rel.id"
								:x1="entityPos(rel.sourceId).x + 80"
								:y1="entityPos(rel.sourceId).y + 24"
								:x2="entityPos(rel.targetId).x + 80"
								:y2="entityPos(rel.targetId).y + 24"
								stroke="var(--el-border-color)"
								stroke-width="2"
								marker-end="url(#arrow)"
							/>
							<defs>
								<marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
									<path d="M0,0 L6,3 L0,6 Z" fill="var(--el-text-color-secondary)" />
								</marker>
							</defs>
						</svg>
						<div
							v-for="ent in mockEntities"
							:key="ent.id"
							class="kg-schema__entity"
							:class="{ 'is-active': selection?.type === 'Entity' && selection.id === ent.id }"
							:style="{ left: ent.x + 'px', top: ent.y + 'px' }"
							@click.stop="select({ type: 'Entity', id: ent.id })"
						>
							<div class="kg-schema__entity-name">{{ ent.name }}</div>
							<div class="kg-schema__entity-en">{{ ent.nameEn }}</div>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :span="6">
				<el-card v-if="inspector" shadow="never">
					<template #header>{{ t('message.pages.schema.inspector') }}</template>
					<h4>{{ inspector.title }}</h4>
					<p class="kg-schema__muted">{{ inspector.subtitle }}</p>
					<el-divider />
					<div v-if="inspector.properties?.length">
						<div class="kg-schema__list-title">{{ t('message.pages.schema.properties') }}</div>
						<el-tag v-for="p in inspector.properties" :key="p.name" class="mr-1 mb-1" size="small">
							{{ p.name }} ({{ p.type }})
						</el-tag>
					</div>
					<div v-if="inspector.impact" class="mt-2">
						<div class="kg-schema__list-title">{{ t('message.pages.schema.impact') }}</div>
						<p>实例: {{ inspector.impact.instances }} · 模型: {{ inspector.impact.models }}</p>
						<el-tag :type="inspector.impact.risk === 'High' ? 'danger' : 'warning'" size="small">{{ inspector.impact.risk }}</el-tag>
					</div>
				</el-card>
				<el-empty v-else :description="t('message.pages.schema.inspector')" :image-size="64" />
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="kg-schema-index">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { SelectionType } from './types';
import { mockCommunities, mockEntities, mockRelations } from './mock';

const { t } = useI18n();
const selection = ref<SelectionType>(null);
const searchQuery = ref('');

const filteredEntities = computed(() => {
	if (!searchQuery.value) return mockEntities;
	const q = searchQuery.value.toLowerCase();
	return mockEntities.filter((e) => e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q));
});

const filteredRelations = computed(() => {
	if (!searchQuery.value) return mockRelations;
	const q = searchQuery.value.toLowerCase();
	return mockRelations.filter((r) => r.name.toLowerCase().includes(q));
});

const inspector = computed(() => {
	if (!selection.value) return null;
	if (selection.value.type === 'Community') {
		const c = mockCommunities.find((x) => x.id === selection.value!.id);
		return c ? { title: c.name, subtitle: c.desc, impact: null, properties: [] } : null;
	}
	if (selection.value.type === 'Entity') {
		const e = mockEntities.find((x) => x.id === selection.value!.id);
		return e ? { title: e.name, subtitle: e.domain, properties: e.properties, impact: e.impact } : null;
	}
	const r = mockRelations.find((x) => x.id === selection.value!.id);
	return r ? { title: r.name, subtitle: r.semantics.desc, properties: [], impact: r.impact } : null;
});

function entityPos(id: string) {
	const e = mockEntities.find((x) => x.id === id);
	return e ? { x: e.x, y: e.y } : { x: 0, y: 0 };
}

function select(s: SelectionType) {
	selection.value = s;
}

function save() {
	ElMessage.success(t('message.pages.schema.saved'));
}

function publish() {
	ElMessage.success(t('message.pages.schema.published'));
}
</script>

<style scoped lang="scss">
.kg-schema__head {
	display: flex;
	justify-content: space-between;
	margin-bottom: 16px;
	h1 {
		margin: 0 0 4px;
		font-size: 22px;
	}
	p {
		margin: 0;
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}
}
.kg-schema__body {
	min-height: 520px;
}
.kg-schema__side {
	height: 100%;
}
.kg-schema__com,
.kg-schema__item {
	padding: 8px 10px;
	border-radius: 6px;
	cursor: pointer;
	margin-bottom: 4px;
	&:hover,
	&.is-active {
		background: var(--el-color-primary-light-9);
	}
	p {
		margin: 4px 0 0;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}
}
.kg-schema__list-title {
	font-size: 12px;
	font-weight: 600;
	color: var(--el-text-color-secondary);
	margin-bottom: 6px;
}
.kg-schema__canvas-card {
	height: 100%;
}
.kg-schema__canvas {
	position: relative;
	height: 460px;
	background: var(--el-fill-color-lighter);
	border-radius: 8px;
	overflow: hidden;
}
.kg-schema__lines {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}
.kg-schema__entity {
	position: absolute;
	width: 160px;
	padding: 10px;
	background: var(--el-bg-color);
	border: 2px solid var(--el-border-color);
	border-radius: 8px;
	cursor: pointer;
	&.is-active {
		border-color: var(--el-color-primary);
	}
}
.kg-schema__entity-name {
	font-weight: 600;
	font-size: 13px;
}
.kg-schema__entity-en {
	font-size: 11px;
	color: var(--el-text-color-secondary);
}
.kg-schema__muted {
	font-size: 13px;
	color: var(--el-text-color-secondary);
}
.mt-2 {
	margin-top: 8px;
}
.mb-2 {
	margin-bottom: 8px;
}
.mr-1 {
	margin-right: 4px;
}
.mb-1 {
	margin-bottom: 4px;
}
</style>
