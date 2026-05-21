<template>
	<div class="kg-schema">
		<header class="kg-schema__toolbar">
			<div class="kg-schema__toolbar-left">
				<div class="kg-schema__subtitle">
					<el-icon><Share /></el-icon>
					{{ t('message.pages.schema.workbench') }}
				</div>
				<h1>{{ t('message.pages.schema.title') }}</h1>
				<span class="kg-schema__sep" />
				<span class="kg-schema__ver">{{ t('message.pages.schema.currentVersion', { ver: SCHEMA_VERSION }) }}</span>
				<span class="kg-schema__save-status">
					<el-icon v-if="isSaved" class="is-green"><CircleCheck /></el-icon>
					<span v-else class="kg-schema__dot" />
					{{ isSaved ? t('message.pages.schema.autoSaved') : t('message.pages.schema.editing') }}
					<em>| {{ t('message.pages.schema.lastUpdate') }}</em>
				</span>
				<button type="button" class="kg-schema__link-btn" @click="historyOpen = true">
					<el-icon><Clock /></el-icon>
					{{ t('message.pages.schema.history') }}
				</button>
			</div>
			<div class="kg-schema__toolbar-right">
				<div class="kg-schema__io-group">
					<button type="button" class="kg-schema__io-btn" @click="openImport">
						<el-icon class="is-blue"><Upload /></el-icon>
						{{ t('message.pages.schema.importSchema') }}
					</button>
					<button type="button" class="kg-schema__io-btn" @click="ElMessage.success(t('message.pages.schema.exportToast'))">
						<el-icon class="is-green"><Download /></el-icon>
						{{ t('message.pages.schema.export') }}
						<el-icon><ArrowDown /></el-icon>
					</button>
				</div>
				<div class="kg-schema__search-wrap">
					<el-icon><Search /></el-icon>
					<input v-model="searchQuery" :placeholder="t('message.pages.schema.searchGlobal')" />
				</div>
				<div class="kg-schema__undo-group">
					<button type="button" class="kg-icon-btn"><el-icon><RefreshLeft /></el-icon></button>
					<button type="button" class="kg-icon-btn"><el-icon><RefreshRight /></el-icon></button>
				</div>
				<div class="kg-schema__actions">
					<button type="button" class="kg-btn-outline" @click="save">
						<el-icon><Document /></el-icon>
						{{ t('message.pages.schema.saveDraft') }}
					</button>
					<button type="button" class="kg-btn-submit" @click="publish">
						<el-icon><Promotion /></el-icon>
						{{ t('message.pages.schema.submitPublish') }}
					</button>
				</div>
			</div>
		</header>

		<div class="kg-schema__workspace">
			<!-- Left tree -->
			<aside class="kg-schema__nav">
				<div class="kg-schema__nav-title">{{ t('message.pages.schema.resourceTree') }}</div>
				<div class="kg-schema__nav-body">
					<div class="kg-schema__section">
						<button type="button" class="kg-schema__section-head" @click="expanded.communities = !expanded.communities">
							<el-icon><component :is="expanded.communities ? ArrowDown : ArrowRight" /></el-icon>
							<el-icon class="is-indigo"><User /></el-icon>
							{{ t('message.pages.schema.communities') }}
							<span class="count">{{ mockCommunities.length }}</span>
						</button>
						<div v-show="expanded.communities" class="kg-schema__section-items">
							<button
								v-for="c in mockCommunities"
								:key="c.id"
								type="button"
								class="kg-schema__nav-item"
								:class="{ 'is-active': selection?.type === 'Community' && selection.id === c.id }"
								@click="selection = { type: 'Community', id: c.id }"
							>
								{{ c.name }}
							</button>
						</div>
					</div>
					<div class="kg-schema__section">
						<button type="button" class="kg-schema__section-head" @click="expanded.entities = !expanded.entities">
							<el-icon><component :is="expanded.entities ? ArrowDown : ArrowRight" /></el-icon>
							<el-icon class="is-green"><Box /></el-icon>
							{{ t('message.pages.schema.entities') }}
							<span class="count">{{ mockEntities.length }}</span>
						</button>
						<div v-show="expanded.entities" class="kg-schema__section-items">
							<button
								v-for="e in filteredEntities"
								:key="e.id"
								type="button"
								class="kg-schema__nav-item"
								:class="{ 'is-active': selection?.type === 'Entity' && selection.id === e.id, 'is-emerald': selection?.type === 'Entity' && selection.id === e.id }"
								@click="selection = { type: 'Entity', id: e.id }"
							>
								{{ e.name }}
							</button>
						</div>
					</div>
					<div class="kg-schema__section">
						<button type="button" class="kg-schema__section-head" @click="expanded.relations = !expanded.relations">
							<el-icon><component :is="expanded.relations ? ArrowDown : ArrowRight" /></el-icon>
							<el-icon class="is-blue"><Share /></el-icon>
							{{ t('message.pages.schema.relations') }}
							<span class="count">{{ mockRelations.length }}</span>
						</button>
						<div v-show="expanded.relations" class="kg-schema__section-items">
							<button
								v-for="r in filteredRelations"
								:key="r.id"
								type="button"
								class="kg-schema__nav-item"
								:class="{ 'is-active': selection?.type === 'Relation' && selection.id === r.id, 'is-blue': selection?.type === 'Relation' && selection.id === r.id }"
								@click="selection = { type: 'Relation', id: r.id }"
							>
								{{ r.name }}
							</button>
						</div>
					</div>
				</div>
				<div class="kg-schema__nav-foot">
					<button type="button" class="kg-nav-add"><el-icon><Plus /></el-icon>{{ t('message.pages.schema.addEntity') }}</button>
					<button type="button" class="kg-nav-add"><el-icon><Plus /></el-icon>{{ t('message.pages.schema.addRelation') }}</button>
				</div>
			</aside>

			<!-- Canvas -->
			<div class="kg-schema__canvas-wrap" @click="selection = null">
				<div class="kg-schema__grid" />
				<svg class="kg-schema__svg">
					<defs>
						<marker id="kg-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
							<polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
						</marker>
						<marker id="kg-arrow-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
							<polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
						</marker>
					</defs>
					<g
						v-for="rel in mockRelations"
						:key="rel.id"
						class="kg-schema__edge"
						@click.stop="selection = { type: 'Relation', id: rel.id }"
					>
						<path :d="geom(rel).pathD" fill="none" stroke="transparent" stroke-width="20" />
						<path
							:d="geom(rel).pathD"
							fill="none"
							:stroke="edgeStroke(rel)"
							:stroke-width="edgeWidth(rel)"
							:stroke-dasharray="rel.semantics.inverse ? '0' : '5 5'"
							:marker-end="edgeMarker(rel)"
						/>
						<rect
							:x="geom(rel).midX - 40"
							:y="geom(rel).midY - 12"
							width="80"
							height="24"
							rx="4"
							:fill="selection?.type === 'Relation' && selection.id === rel.id ? '#eff6ff' : '#fff'"
							:stroke="selection?.type === 'Relation' && selection.id === rel.id ? '#60a5fa' : '#cbd5e1'"
							:stroke-width="selection?.type === 'Relation' && selection.id === rel.id ? 2 : 1"
						/>
						<text
							:x="geom(rel).midX"
							:y="geom(rel).midY + 4"
							text-anchor="middle"
							class="kg-schema__edge-label"
							:class="{ 'is-active': selection?.type === 'Relation' && selection.id === rel.id }"
						>
							{{ rel.name }}
						</text>
					</g>
				</svg>

				<div
					v-for="ent in mockEntities"
					:key="ent.id"
					class="kg-schema__node"
					:class="{
						'is-selected': selection?.type === 'Entity' && selection.id === ent.id,
						'is-highlight': isEntityHighlighted(ent),
					}"
					:style="{ left: ent.x + 'px', top: ent.y + 'px' }"
					@click.stop="selection = { type: 'Entity', id: ent.id }"
				>
					<div class="kg-schema__node-head">
						<el-icon><Box /></el-icon>
						<span>{{ ent.name }}</span>
					</div>
					<div class="kg-schema__node-body">
						<div class="mono">{{ ent.id }}</div>
						<div class="kg-schema__node-tags">
							<span class="kg-tag-domain">{{ ent.domain }}</span>
							<span v-for="cId in ent.communities" :key="cId" class="kg-tag-com">{{ communityName(cId) }}</span>
						</div>
					</div>
				</div>

				<div class="kg-schema__float-tools" @click.stop>
					<button type="button" class="kg-icon-btn" :title="t('message.pages.schema.toolLink')"><el-icon><Link /></el-icon></button>
					<button type="button" class="kg-icon-btn" :title="t('message.pages.schema.toolMap')"><el-icon><Location /></el-icon></button>
					<button type="button" class="kg-icon-btn" :title="t('message.pages.schema.toolLayout')"><el-icon><TrendCharts /></el-icon></button>
				</div>
			</div>

			<SchemaConfigPanel :selection="selection" />
		</div>

		<!-- History drawer -->
		<Teleport to="body">
			<div v-if="historyOpen" class="kg-schema-overlay" @click.self="historyOpen = false">
				<aside class="kg-schema-history">
					<div class="kg-schema-history__head">
						<span><el-icon><Clock /></el-icon> {{ t('message.pages.schema.historyTitle') }}</span>
						<button type="button" class="kg-icon-btn" @click="historyOpen = false"><el-icon><Close /></el-icon></button>
					</div>
					<div class="kg-schema-history__body">
						<div class="kg-hist-item is-current">
							<strong>KB-ONT-V2.1.0-draft (当前草稿)</strong>
							<p>更新于 今天 10:24 · 你</p>
							<div class="kg-hist-note">正在扩充故障预测相关属性。</div>
						</div>
						<div class="kg-hist-item">
							<div class="kg-hist-row">
								<strong>KB-ONT-V2.1.0</strong>
								<span class="kg-badge-pub">已发布</span>
							</div>
							<p>2024-05-18 14:00 · 系统管理员</p>
							<div class="kg-hist-note">合并了设备台账实体的微调规范。</div>
						</div>
						<div class="kg-hist-item">
							<strong>KB-ONT-V2.0.0</strong>
							<p>2024-03-10 09:12 · 张工</p>
							<div class="kg-hist-note">年度大发版：重构维修工艺节点结构。</div>
						</div>
					</div>
				</aside>
			</div>
		</Teleport>

		<!-- Import modal -->
		<Teleport to="body">
			<div v-if="importOpen" class="kg-schema-overlay is-center" @click.self="importOpen = false">
				<div class="kg-schema-import">
					<div class="kg-schema-import__head">
						<span><el-icon class="is-blue"><Upload /></el-icon> {{ t('message.pages.schema.importTitle') }}</span>
						<button type="button" class="kg-icon-btn" @click="importOpen = false"><el-icon><Close /></el-icon></button>
					</div>
					<div class="kg-schema-import__body">
						<div v-if="importState === 'analyzing'" class="kg-schema-import__loading">
							<div class="spinner" />
							<p>{{ t('message.pages.schema.importAnalyzing') }}</p>
						</div>
						<div v-else class="kg-schema-import__upload">
							<el-icon><UploadFilled /></el-icon>
							<p>上传 .schema 建模文件</p>
							<input type="file" accept=".schema,.json,.txt" @change="onSchemaFile" />
						</div>
					</div>
					<div class="kg-schema-import__foot">
						<button type="button" class="kg-btn-outline" @click="importOpen = false">取消</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts" name="kg-schema-index">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowDown,
	ArrowRight,
	Box,
	CircleCheck,
	Clock,
	Close,
	Document,
	Download,
	Link,
	Location,
	Plus,
	Promotion,
	RefreshLeft,
	RefreshRight,
	Search,
	Share,
	TrendCharts,
	Upload,
	UploadFilled,
	User,
} from '@element-plus/icons-vue';
import SchemaConfigPanel from './components/SchemaConfigPanel.vue';
import type { EntityNode, RelationNode, SelectionType } from './types';
import { SCHEMA_VERSION, defaultSchemaText, mockCommunities, mockEntities, mockRelations } from './mock';

const { t } = useI18n();

const selection = ref<SelectionType>({ type: 'Entity', id: 'ent-003' });
const searchQuery = ref('');
const isSaved = ref(true);
const historyOpen = ref(false);
const importOpen = ref(false);
const importState = ref<'idle' | 'analyzing'>('idle');

const expanded = reactive({ communities: true, entities: true, relations: true });

const filteredEntities = computed(() => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return mockEntities;
	return mockEntities.filter((e) => e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q) || e.id.includes(q));
});

const filteredRelations = computed(() => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return mockRelations;
	return mockRelations.filter((r) => r.name.toLowerCase().includes(q) || r.nameEn.toLowerCase().includes(q));
});

function communityName(id: string) {
	return mockCommunities.find((c) => c.id === id)?.name ?? id;
}

function isEntityHighlighted(ent: EntityNode) {
	if (!selection.value) return false;
	if (selection.value.type === 'Entity' && selection.value.id === ent.id) return true;
	if (selection.value.type === 'Community' && ent.communities.includes(selection.value.id)) return true;
	if (selection.value.type === 'Relation') {
		const rel = mockRelations.find((r) => r.id === selection.value!.id);
		return rel ? rel.sourceId === ent.id || rel.targetId === ent.id : false;
	}
	return false;
}

function isRelationHighlighted(rel: RelationNode) {
	if (!selection.value) return false;
	if (selection.value.type === 'Relation' && selection.value.id === rel.id) return true;
	if (selection.value.type === 'Entity') {
		return rel.sourceId === selection.value.id || rel.targetId === selection.value.id;
	}
	if (selection.value.type === 'Community') {
		const s = mockEntities.find((e) => e.id === rel.sourceId);
		const tg = mockEntities.find((e) => e.id === rel.targetId);
		return s?.communities.includes(selection.value.id) || tg?.communities.includes(selection.value.id);
	}
	return false;
}

function geom(rel: RelationNode) {
	const source = mockEntities.find((e) => e.id === rel.sourceId)!;
	const target = mockEntities.find((e) => e.id === rel.targetId)!;
	const isVertical = Math.abs(source.x - target.x) < 50;
	if (isVertical) {
		return {
			pathD: `M${source.x + 96} ${source.y + 72} L${target.x + 96} ${target.y}`,
			midX: (source.x + target.x) / 2 + 96,
			midY: (source.y + 72 + target.y) / 2,
		};
	}
	return {
		pathD: `M${source.x + 192} ${source.y + 36} L${target.x} ${target.y + 36}`,
		midX: (source.x + 192 + target.x) / 2,
		midY: source.y + 36,
	};
}

function edgeStroke(rel: RelationNode) {
	if (selection.value?.type === 'Relation' && selection.value.id === rel.id) return '#2563eb';
	if (isRelationHighlighted(rel)) return '#60a5fa';
	return '#94a3b8';
}

function edgeWidth(rel: RelationNode) {
	return selection.value?.type === 'Relation' && selection.value.id === rel.id ? 3 : 2;
}

function edgeMarker(rel: RelationNode) {
	const active = isRelationHighlighted(rel) || (selection.value?.type === 'Relation' && selection.value.id === rel.id);
	return active ? 'url(#kg-arrow-active)' : 'url(#kg-arrow)';
}

function save() {
	isSaved.value = true;
	ElMessage.success(t('message.pages.schema.saved'));
}

function publish() {
	ElMessage.success(t('message.pages.schema.published'));
}

function openImport() {
	importOpen.value = true;
	importState.value = 'idle';
	void defaultSchemaText;
}

function onSchemaFile(e: Event) {
	const input = e.target as HTMLInputElement;
	if (!input.files?.length) return;
	importState.value = 'analyzing';
	setTimeout(() => {
		importState.value = 'idle';
		importOpen.value = false;
		ElMessage.success(t('message.pages.schema.importSuccess'));
		input.value = '';
	}, 1500);
}
</script>

<style scoped lang="scss">
.kg-schema {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 100px);
	min-height: 640px;
	margin: -8px -12px 0;
	background: #fff;
	overflow: hidden;
}

.kg-schema__toolbar {
	flex-shrink: 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	padding: 12px 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	z-index: 10;
}

.kg-schema__toolbar-left {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.kg-schema__subtitle {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: #64748b;
	font-weight: 500;
}

.kg-schema__toolbar-left h1 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #0f172a;
}

.kg-schema__sep {
	width: 1px;
	height: 28px;
	background: #e2e8f0;
}

.kg-schema__ver {
	font-size: 11px;
	font-family: ui-monospace, monospace;
	padding: 4px 10px;
	border: 1px solid #bfdbfe;
	background: #eff6ff;
	color: #1e40af;
	border-radius: 4px;
}

.kg-schema__save-status {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #64748b;
	.is-green {
		color: #059669;
	}
	em {
		font-style: normal;
		color: #94a3b8;
	}
}

.kg-schema__dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #f59e0b;
}

.kg-schema__link-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border: none;
	background: none;
	font-size: 12px;
	color: var(--el-color-primary);
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	&:hover {
		background: rgba(59, 130, 246, 0.08);
	}
}

.kg-schema__toolbar-right {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.kg-schema__io-group {
	display: flex;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	overflow: hidden;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kg-schema__io-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 32px;
	padding: 0 12px;
	border: none;
	border-right: 1px solid #e2e8f0;
	background: #fff;
	font-size: 12px;
	cursor: pointer;
	&:last-child {
		border-right: none;
	}
	.is-blue {
		color: #2563eb;
	}
	.is-green {
		color: #059669;
	}
	&:hover {
		background: #f8fafc;
	}
}

.kg-schema__search-wrap {
	position: relative;
	input {
		width: 224px;
		height: 32px;
		padding: 0 10px 0 30px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 13px;
		background: #f8fafc;
		outline: none;
	}
	.el-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: #94a3b8;
	}
}

.kg-schema__undo-group {
	display: flex;
	gap: 2px;
	padding: 2px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #f8fafc;
}

.kg-schema__actions {
	display: flex;
	gap: 8px;
	padding-left: 10px;
	border-left: 1px solid #e2e8f0;
}

.kg-btn-outline {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 32px;
	padding: 0 12px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 13px;
	color: #334155;
	cursor: pointer;
	&:hover {
		background: #f8fafc;
	}
}

.kg-btn-submit {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 32px;
	padding: 0 16px;
	border: none;
	border-radius: 6px;
	background: #cc0000;
	color: #fff;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 2px 4px rgba(204, 0, 0, 0.25);
	&:hover {
		background: #a30000;
	}
}

.kg-schema__workspace {
	flex: 1;
	display: flex;
	overflow: hidden;
	min-height: 0;
}

.kg-schema__nav {
	width: 300px;
	flex-shrink: 0;
	border-right: 1px solid rgba(0, 0, 0, 0.08);
	display: flex;
	flex-direction: column;
	background: rgba(255, 255, 255, 0.8);
	box-shadow: 2px 0 10px rgba(0, 0, 0, 0.02);
}

.kg-schema__nav-title {
	padding: 12px 14px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #64748b;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.kg-schema__nav-body {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.kg-schema__section-head {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	border: none;
	background: transparent;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	color: #1e293b;
	cursor: pointer;
	text-align: left;
	&:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	.is-indigo {
		color: #4f46e5;
	}
	.is-green {
		color: #059669;
	}
	.is-blue {
		color: #3b82f6;
	}
	.count {
		margin-left: auto;
		font-size: 11px;
		padding: 1px 6px;
		background: #f1f5f9;
		border-radius: 4px;
		color: #64748b;
	}
}

.kg-schema__section-items {
	padding-left: 24px;
	margin-bottom: 8px;
}

.kg-schema__nav-item {
	width: 100%;
	text-align: left;
	padding: 6px 10px;
	border: 1px solid transparent;
	border-radius: 6px;
	font-size: 13px;
	color: #475569;
	background: transparent;
	cursor: pointer;
	margin-bottom: 2px;
	&:hover {
		background: #f1f5f9;
	}
	&.is-active.is-emerald {
		background: #ecfdf5;
		color: #047857;
		border-color: #a7f3d0;
		font-weight: 600;
	}
	&.is-active.is-blue {
		background: #eff6ff;
		color: #1d4ed8;
		border-color: #bfdbfe;
		font-weight: 600;
	}
	&.is-active:not(.is-emerald):not(.is-blue) {
		background: #eef2ff;
		color: #4338ca;
		border-color: #c7d2fe;
		font-weight: 600;
	}
}

.kg-schema__nav-foot {
	padding: 12px;
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.kg-nav-add {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	height: 32px;
	border: 1px dashed #cbd5e1;
	border-radius: 6px;
	background: transparent;
	font-size: 12px;
	color: var(--el-color-primary);
	cursor: pointer;
	&:hover {
		background: rgba(59, 130, 246, 0.05);
		border-color: var(--el-color-primary);
	}
}

.kg-schema__canvas-wrap {
	flex: 1;
	position: relative;
	overflow: hidden;
	background: #eef2f6;
	min-width: 0;
}

.kg-schema__grid {
	position: absolute;
	inset: 0;
	opacity: 0.6;
	background-image: linear-gradient(to right, #cbd5e1 1px, transparent 1px),
		linear-gradient(to bottom, #cbd5e1 1px, transparent 1px);
	background-size: 40px 40px;
}

.kg-schema__svg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	z-index: 10;
	pointer-events: none;
	.kg-schema__edge {
		pointer-events: all;
		cursor: pointer;
	}
}

.kg-schema__edge-label {
	font-size: 11px;
	fill: #475569;
	font-weight: 500;
	&.is-active {
		fill: #1d4ed8;
	}
}

.kg-schema__node {
	position: absolute;
	z-index: 20;
	width: 192px;
	background: #fff;
	border: 2px solid #e2e8f0;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	cursor: pointer;
	transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
	&.is-highlight {
		border-color: #93c5fd;
	}
	&.is-selected {
		border-color: #3b82f6;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
		transform: scale(1.02);
	}
}

.kg-schema__node-head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: #f8fafc;
	border-radius: 6px 6px 0 0;
	font-size: 14px;
	font-weight: 600;
	.el-icon {
		color: #059669;
	}
}

.kg-schema__node.is-selected .kg-schema__node-head {
	background: rgba(59, 130, 246, 0.08);
	.el-icon {
		color: #2563eb;
	}
}

.kg-schema__node-body {
	padding: 10px 12px;
	.mono {
		font-size: 11px;
		font-family: ui-monospace, monospace;
		color: #64748b;
		margin-bottom: 8px;
	}
}

.kg-schema__node-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.kg-tag-domain {
	font-size: 10px;
	padding: 2px 6px;
	background: #f1f5f9;
	color: #475569;
	border-radius: 4px;
}

.kg-tag-com {
	font-size: 10px;
	padding: 2px 6px;
	border: 1px solid #c7d2fe;
	background: #eef2ff;
	color: #4338ca;
	border-radius: 4px;
}

.kg-schema__float-tools {
	position: absolute;
	left: 24px;
	bottom: 24px;
	z-index: 30;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 6px;
	background: rgba(255, 255, 255, 0.92);
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(8px);
}

.kg-icon-btn {
	width: 36px;
	height: 36px;
	border: none;
	background: transparent;
	border-radius: 6px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	&:hover {
		background: rgba(59, 130, 246, 0.08);
		color: #2563eb;
	}
}

.kg-schema-overlay {
	position: fixed;
	inset: 0;
	z-index: 2000;
	background: rgba(15, 23, 42, 0.4);
	backdrop-filter: blur(2px);
	&.is-center {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
}

.kg-schema-history {
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
	width: 450px;
	background: #fff;
	box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
	display: flex;
	flex-direction: column;
	animation: slideIn 0.25s ease;
}

@keyframes slideIn {
	from {
		transform: translateX(100%);
	}
	to {
		transform: translateX(0);
	}
}

.kg-schema-history__head {
	display: flex;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #e2e8f0;
	background: #f8fafc;
	font-weight: 600;
}

.kg-schema-history__body {
	flex: 1;
	overflow-y: auto;
	padding: 24px;
}

.kg-hist-item {
	position: relative;
	padding-left: 24px;
	padding-bottom: 24px;
	border-left: 2px solid #e2e8f0;
	&::before {
		content: '';
		position: absolute;
		left: -9px;
		top: 4px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #94a3b8;
		border: 3px solid #fff;
	}
	&.is-current {
		border-left-color: var(--el-color-primary);
		&::before {
			background: var(--el-color-primary);
		}
	}
	strong {
		font-size: 14px;
	}
	p {
		margin: 6px 0;
		font-size: 12px;
		color: #64748b;
	}
}

.kg-hist-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.kg-hist-note {
	font-size: 12px;
	padding: 8px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	color: #475569;
}

.kg-badge-pub {
	font-size: 10px;
	padding: 2px 8px;
	background: #ecfdf5;
	color: #047857;
	border: 1px solid #a7f3d0;
	border-radius: 4px;
}

.kg-schema-import {
	width: 100%;
	max-width: 640px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
	overflow: hidden;
}

.kg-schema-import__head {
	display: flex;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #e2e8f0;
	background: #f8fafc;
	font-weight: 600;
	.is-blue {
		color: #2563eb;
	}
}

.kg-schema-import__body {
	padding: 32px;
	min-height: 200px;
}

.kg-schema-import__loading {
	text-align: center;
	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e2e8f0;
		border-top-color: #2563eb;
		border-radius: 50%;
		margin: 0 auto 16px;
		animation: spin 0.8s linear infinite;
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.kg-schema-import__upload {
	position: relative;
	border: 2px dashed #cbd5e1;
	border-radius: 12px;
	padding: 48px;
	text-align: center;
	.el-icon {
		font-size: 48px;
		color: #2563eb;
		margin-bottom: 12px;
	}
	input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
}

.kg-schema-import__foot {
	padding: 16px 20px;
	border-top: 1px solid #e2e8f0;
	display: flex;
	justify-content: flex-end;
	background: #f8fafc;
}
</style>
