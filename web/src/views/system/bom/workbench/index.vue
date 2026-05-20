<template>
	<div class="kg-bom-wb">
		<header class="kg-bom-wb__top">
			<div class="kg-bom-wb__breadcrumb">
				<el-icon><Coin /></el-icon>
				<span>{{ t('message.pages.bom.breadcrumbSystem') }}</span>
				<el-icon class="kg-bom-wb__chev"><ArrowRight /></el-icon>
				<button type="button" class="kg-bom-wb__link" @click="router.push('/bom-management')">
					{{ t('message.pages.bom.breadcrumbCurrent') }}
				</button>
				<el-icon class="kg-bom-wb__chev"><ArrowRight /></el-icon>
				<span>{{ summary.code }} ({{ summary.version }})</span>
				<el-icon class="kg-bom-wb__chev"><ArrowRight /></el-icon>
				<span class="is-active">{{ t('message.pages.bom.extractBreadcrumb') }}</span>
			</div>

			<div class="kg-bom-wb__title-row">
				<div class="kg-bom-wb__title-left">
					<button type="button" class="kg-bom-wb__back" @click="router.push('/bom-management')">
						<el-icon><ArrowLeft /></el-icon>
					</button>
					<h1>{{ t('message.pages.bom.extractWorkbench') }}</h1>
					<span class="kg-bom-wb__divider" />
					<div class="kg-bom-wb__meta">
						<span><em>{{ t('message.pages.bom.bomNameLabel') }}:</em> {{ summary.name }}</span>
						<span><em>{{ t('message.pages.bom.deviceModelLabel') }}:</em> {{ summary.deviceModel }}</span>
						<span class="kg-bom-wb__ver">{{ summary.version }}</span>
						<span v-if="summary.status === 'Active'" class="kg-badge kg-badge--success">{{ t('message.pages.bom.statusEnabled') }}</span>
					</div>
				</div>
				<div class="kg-bom-wb__title-right">
					<div class="kg-bom-wb__search-wrap">
						<el-icon><Search /></el-icon>
						<input v-model="searchQuery" :placeholder="t('message.pages.bom.searchPart')" />
					</div>
					<button type="button" class="kg-icon-btn" :title="t('message.pages.bom.refreshSource')" @click="onRefresh">
						<el-icon><Refresh /></el-icon>
					</button>
					<button type="button" class="kg-bom-wb__import-btn" @click="onImport">
						<el-icon><VideoPlay /></el-icon>
						{{ t('message.pages.bom.startImport') }}
					</button>
				</div>
			</div>
		</header>

		<div class="kg-bom-wb__workspace">
			<!-- Left: tree -->
			<div class="kg-bom-wb__tree-pane">
				<div class="kg-bom-wb__pane-head">
					<span class="kg-bom-wb__pane-title">
						<el-icon><Grid /></el-icon>
						{{ t('message.pages.bom.structureTitle') }}
					</span>
					<span class="kg-bom-wb__pane-sub">{{ t('message.pages.bom.nodeCount', { count: allNodes.length }) }}</span>
				</div>
				<div class="kg-bom-wb__tree-scroll">
					<div class="kg-bom-wb__tree-table">
						<div class="kg-bom-wb__tree-h">
							<span class="w-chev" />
							<span class="w-chk" />
							<span class="flex-1">{{ t('message.pages.bom.treeColNameCode') }}</span>
							<span class="w-lvl">{{ t('message.pages.bom.treeColLvl') }}</span>
							<span class="w-spec">{{ t('message.pages.bom.treeColSpec') }}</span>
							<span class="w-st">{{ t('message.pages.bom.treeColStatus') }}</span>
						</div>
						<BomTreeRow
							:node="treeRoot"
							:expanded-ids="expandedIds"
							:search-query="searchQuery"
							:get-selection-state="getSelectionState"
							@toggle-expand="toggleExpand"
							@toggle-select="toggleSelect"
						/>
					</div>
				</div>
			</div>

			<!-- Right: graph preview -->
			<div class="kg-bom-wb__graph-pane">
				<div class="kg-bom-wb__graph-toolbar">
					<span class="kg-bom-wb__graph-label">
						<el-icon><Box /></el-icon>
						{{ t('message.pages.bom.graphPreview') }}
					</span>
					<div class="kg-bom-wb__graph-zoom">
						<button type="button" class="kg-icon-btn"><el-icon><ZoomOut /></el-icon></button>
						<button type="button" class="kg-icon-btn"><el-icon><ZoomIn /></el-icon></button>
						<span class="kg-bom-wb__zoom-sep" />
						<button type="button" class="kg-icon-btn"><el-icon><FullScreen /></el-icon></button>
					</div>
				</div>
				<div class="kg-bom-wb__graph-body">
					<div v-if="selectedIds.size === 0" class="kg-bom-wb__graph-empty">
						<el-icon><Coin /></el-icon>
						<p>{{ t('message.pages.bom.graphPreviewEmpty') }}</p>
					</div>
					<div v-else class="kg-bom-wb__graph-viz">
						<div class="kg-bom-wb__graph-root">{{ t('message.pages.bom.graphRoot') }}</div>
						<div class="kg-bom-wb__graph-line" />
						<div class="kg-bom-wb__graph-l1">
							<div v-for="node in level1Nodes" :key="node.id" class="kg-bom-wb__graph-branch">
								<div class="kg-bom-wb__graph-line sm" />
								<div class="kg-bom-wb__graph-node" :class="node.status === 'Ingested' ? 'is-conflict' : ''">
									<div>{{ node.name }}</div>
									<div class="mono">{{ node.code }}</div>
								</div>
								<div v-if="childrenOf(node).length" class="kg-bom-wb__graph-l2">
									<div
										v-for="child in childrenOf(node)"
										:key="child.id"
										class="kg-bom-wb__graph-node sm"
										:class="child.status === 'Ingested' ? 'is-conflict' : ''"
									>
										{{ child.name }}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<footer class="kg-bom-wb__manifest">
			<div class="kg-bom-wb__stats">
				<h3>{{ t('message.pages.bom.manifestTitle') }}</h3>
				<div class="kg-bom-wb__stat-card is-primary">
					<span>{{ t('message.pages.bom.selectedCount') }}</span>
					<strong>{{ selectedIds.size }}</strong>
				</div>
				<div class="kg-bom-wb__stat-card" :class="{ 'is-danger': conflictsCount > 0 }">
					<span>{{ t('message.pages.bom.conflicts') }}</span>
					<strong>{{ conflictsCount }}</strong>
				</div>
				<div class="kg-bom-wb__stat-card">
					<span>{{ t('message.pages.bom.newEntities') }}</span>
					<strong class="is-green">+{{ newImportCount }}</strong>
				</div>
			</div>
			<div class="kg-bom-wb__manifest-table-wrap">
				<div v-if="selectedIds.size === 0" class="kg-bom-wb__manifest-empty">
					{{ t('message.pages.bom.manifestEmpty') }}
				</div>
				<table v-else class="kg-bom-wb__manifest-table">
					<thead>
						<tr>
							<th>{{ t('message.pages.bom.manifestColName') }}</th>
							<th>{{ t('message.pages.bom.manifestColCode') }}</th>
							<th>{{ t('message.pages.bom.manifestColPath') }}</th>
							<th>{{ t('message.pages.bom.manifestColDelta') }}</th>
							<th class="is-right">{{ t('message.pages.bom.manifestColAction') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="id in Array.from(selectedIds)" :key="id">
							<template v-if="nodeById(id)">
								<td class="is-bold">{{ nodeById(id)!.name }}</td>
								<td class="mono">{{ nodeById(id)!.code }}</td>
								<td>{{ pathFor(nodeById(id)!) }}</td>
								<td>
									<span v-if="nodeById(id)!.status === 'Ingested'" class="kg-delta is-conflict">
										{{ t('message.pages.bom.conflictBadge') }}
									</span>
									<span v-else class="kg-delta is-new">{{ t('message.pages.bom.newEntityBadge') }}</span>
								</td>
								<td class="is-right">
									<button type="button" class="kg-icon-btn is-danger" :title="t('message.pages.bom.remove')" @click="removeFromManifest(id)">
										<el-icon><Delete /></el-icon>
									</button>
								</td>
							</template>
						</tr>
					</tbody>
				</table>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts" name="kg-bom-workbench">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowLeft,
	ArrowRight,
	Box,
	Coin,
	Delete,
	FullScreen,
	Grid,
	Refresh,
	Search,
	VideoPlay,
	ZoomIn,
	ZoomOut,
} from '@element-plus/icons-vue';
import BomTreeRow from './BomTreeRow.vue';
import type { BomTreeNode } from '../types';
import { bomSummaryById, workbenchTree } from '../mock';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const bomId = computed(() => (route.params.id as string) || 'bom-001');

const summary = computed(
	() =>
		bomSummaryById[bomId.value] ?? {
			name: 'BOM',
			code: bomId.value,
			version: 'V1.0',
			deviceModel: '—',
			status: 'Active' as const,
		}
);

const treeRoot = workbenchTree;
const searchQuery = ref('');
const expandedIds = ref(new Set(['root', 'n1', 'n2', 'n3']));
const selectedIds = ref(new Set<string>());

function flatten(node: BomTreeNode): BomTreeNode[] {
	let acc: BomTreeNode[] = [node];
	node.children?.forEach((c) => {
		acc = acc.concat(flatten(c));
	});
	return acc;
}

const allNodes = flatten(treeRoot);

function getAllNodeIds(node: BomTreeNode): string[] {
	return flatten(node).map((n) => n.id);
}

function toggleExpand(id: string) {
	const next = new Set(expandedIds.value);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	expandedIds.value = next;
}

function getSelectionState(node: BomTreeNode): 'none' | 'partial' | 'all' {
	const ids = getAllNodeIds(node);
	const selected = ids.filter((id) => selectedIds.value.has(id)).length;
	if (selected === 0) return 'none';
	if (selected === ids.length) return 'all';
	return 'partial';
}

function toggleSelect(node: BomTreeNode, select: boolean) {
	const next = new Set(selectedIds.value);
	const affected = getAllNodeIds(node);
	if (select) {
		affected.forEach((id) => next.add(id));
		let changed = true;
		while (changed) {
			changed = false;
			allNodes.forEach((n) => {
				if (!next.has(n.id) && n.children?.length && n.children.every((c) => next.has(c.id))) {
					next.add(n.id);
					changed = true;
				}
			});
		}
	} else {
		affected.forEach((id) => next.delete(id));
		let changed = true;
		while (changed) {
			changed = false;
			allNodes.forEach((n) => {
				if (next.has(n.id) && n.children?.some((c) => !next.has(c.id))) {
					next.delete(n.id);
					changed = true;
				}
			});
		}
	}
	selectedIds.value = next;
}

function isNodeOrDescendantSelected(node: BomTreeNode): boolean {
	if (selectedIds.value.has(node.id)) return true;
	return node.children?.some((c) => isNodeOrDescendantSelected(c)) ?? false;
}

const graphNodes = computed(() => allNodes.filter((n) => n.id === 'root' || isNodeOrDescendantSelected(n)));

const level1Nodes = computed(() => graphNodes.value.filter((n) => n.level === 1));

function childrenOf(parent: BomTreeNode) {
	return graphNodes.value.filter(
		(n) => n.level === 2 && flatten(parent).some((x) => x.id === n.id)
	);
}

const conflictsCount = computed(
	() => graphNodes.value.filter((n) => n.status === 'Ingested' && selectedIds.value.has(n.id)).length
);
const newImportCount = computed(
	() => graphNodes.value.filter((n) => n.status === 'Pending' && selectedIds.value.has(n.id)).length
);

function nodeById(id: string) {
	return allNodes.find((n) => n.id === id);
}

function pathFor(node: BomTreeNode) {
	if (node.level === 0) return '—';
	if (node.id.startsWith('n1')) return `主机头总成 > ${node.name}`;
	if (node.id.startsWith('n2')) return `油气分离系统 > ${node.name}`;
	if (node.id.startsWith('n3')) return `冷却系统 > ${node.name}`;
	return node.name;
}

function removeFromManifest(id: string) {
	const node = nodeById(id);
	if (node) toggleSelect(node, false);
}

function onRefresh() {
	ElMessage.success(t('message.pages.bom.refreshSource'));
}

function onImport() {
	if (selectedIds.value.size === 0) {
		ElMessage.warning(t('message.pages.bom.selectNodesFirst'));
		return;
	}
	ElMessage.success(t('message.pages.bom.importStarted', { count: selectedIds.value.size }));
}
</script>

<style scoped lang="scss">
.kg-bom-wb {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 120px);
	min-height: 640px;
	margin: -8px -12px 0;
	background: #f8fafc;
}

.kg-bom-wb__top {
	flex-shrink: 0;
	background: #fff;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	padding: 16px 24px;
}

.kg-bom-wb__breadcrumb {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: #64748b;
	margin-bottom: 12px;
	.is-active {
		color: var(--el-color-primary);
		font-weight: 500;
	}
}

.kg-bom-wb__link {
	border: none;
	background: none;
	padding: 0;
	font-size: 13px;
	color: #64748b;
	cursor: pointer;
	&:hover {
		color: var(--el-color-primary);
		text-decoration: underline;
	}
}

.kg-bom-wb__chev {
	font-size: 12px;
}

.kg-bom-wb__title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
}

.kg-bom-wb__title-left {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	h1 {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
	}
}

.kg-bom-wb__back {
	width: 32px;
	height: 32px;
	border: none;
	background: transparent;
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	&:hover {
		background: #f1f5f9;
	}
}

.kg-bom-wb__divider {
	width: 1px;
	height: 24px;
	background: #e2e8f0;
}

.kg-bom-wb__meta {
	display: flex;
	align-items: center;
	gap: 16px;
	font-size: 13px;
	flex-wrap: wrap;
	em {
		font-style: normal;
		color: #64748b;
	}
}

.kg-bom-wb__ver {
	font-family: ui-monospace, monospace;
	font-size: 11px;
	padding: 2px 8px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	background: #f8fafc;
}

.kg-bom-wb__title-right {
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-bom-wb__search-wrap {
	position: relative;
	input {
		width: 256px;
		height: 36px;
		padding: 0 12px 0 32px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 13px;
		outline: none;
		&:focus {
			border-color: rgba(59, 130, 246, 0.4);
			box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
		}
	}
	.el-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: #94a3b8;
	}
}

.kg-bom-wb__import-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	border: none;
	border-radius: 6px;
	background: var(--el-color-primary);
	color: #fff;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	&:hover {
		filter: brightness(1.05);
	}
}

.kg-bom-wb__workspace {
	flex: 1;
	display: flex;
	overflow: hidden;
	min-height: 0;
}

.kg-bom-wb__tree-pane {
	width: 50%;
	display: flex;
	flex-direction: column;
	border-right: 1px solid rgba(0, 0, 0, 0.08);
	background: rgba(255, 255, 255, 0.6);
}

.kg-bom-wb__pane-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: #fff;
}

.kg-bom-wb__pane-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 600;
}

.kg-bom-wb__pane-sub {
	font-size: 12px;
	color: #64748b;
}

.kg-bom-wb__tree-scroll {
	flex: 1;
	overflow: auto;
	padding: 8px;
}

.kg-bom-wb__tree-h {
	display: flex;
	align-items: center;
	padding: 8px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: #64748b;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	position: sticky;
	top: 0;
	background: rgba(255, 255, 255, 0.95);
	z-index: 2;
}

.w-chev {
	width: 20px;
	flex-shrink: 0;
}
.w-chk {
	width: 24px;
	flex-shrink: 0;
}
.w-lvl {
	width: 48px;
	text-align: center;
	flex-shrink: 0;
}
.w-spec {
	width: 80px;
	flex-shrink: 0;
}
.w-st {
	width: 80px;
	text-align: right;
	flex-shrink: 0;
}
.flex-1 {
	flex: 1;
	min-width: 0;
}

.kg-bom-wb__graph-pane {
	width: 50%;
	display: flex;
	flex-direction: column;
	background: #f8fafc;
	position: relative;
}

.kg-bom-wb__graph-toolbar {
	position: absolute;
	top: 12px;
	left: 16px;
	right: 16px;
	display: flex;
	justify-content: space-between;
	z-index: 2;
	pointer-events: none;
	> * {
		pointer-events: auto;
	}
}

.kg-bom-wb__graph-label,
.kg-bom-wb__graph-zoom {
	display: flex;
	align-items: center;
	gap: 6px;
	background: rgba(255, 255, 255, 0.9);
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 6px;
	padding: 6px 10px;
	font-size: 13px;
	font-weight: 500;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kg-bom-wb__zoom-sep {
	width: 1px;
	height: 16px;
	background: #e2e8f0;
}

.kg-bom-wb__graph-body {
	flex: 1;
	overflow: auto;
	padding: 64px 24px 24px;
	background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
	background-size: 16px 16px;
}

.kg-bom-wb__graph-empty {
	height: 100%;
	min-height: 280px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	color: #94a3b8;
	.el-icon {
		font-size: 48px;
	}
	p {
		margin: 0;
		font-size: 13px;
	}
}

.kg-bom-wb__graph-viz {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 16px;
}

.kg-bom-wb__graph-root {
	border: 2px solid rgba(59, 130, 246, 0.3);
	background: rgba(59, 130, 246, 0.1);
	padding: 8px 16px;
	border-radius: 8px;
	font-size: 13px;
	font-weight: 600;
	color: #1e3a8a;
}

.kg-bom-wb__graph-line {
	width: 2px;
	height: 32px;
	background: rgba(59, 130, 246, 0.3);
	&.sm {
		height: 24px;
	}
}

.kg-bom-wb__graph-l1 {
	display: flex;
	gap: 48px;
	position: relative;
	padding-top: 0;
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 48px;
		right: 48px;
		height: 2px;
		background: rgba(59, 130, 246, 0.3);
	}
}

.kg-bom-wb__graph-branch {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.kg-bom-wb__graph-node {
	border: 1px solid #93c5fd;
	background: #fff;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 500;
	width: 128px;
	text-align: center;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	.mono {
		font-family: ui-monospace, monospace;
		font-size: 10px;
		opacity: 0.7;
		margin-top: 2px;
	}
	&.is-conflict {
		background: #fef2f2;
		border-color: #fecaca;
		color: #991b1b;
	}
	&.sm {
		width: 112px;
		font-size: 10px;
		padding: 6px 8px;
	}
}

.kg-bom-wb__graph-l2 {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 8px;
	align-items: center;
}

.kg-bom-wb__manifest {
	flex-shrink: 0;
	height: 256px;
	border-top: 1px solid rgba(0, 0, 0, 0.08);
	background: #fff;
	display: flex;
}

.kg-bom-wb__stats {
	width: 256px;
	flex-shrink: 0;
	border-right: 1px solid rgba(0, 0, 0, 0.06);
	padding: 16px;
	background: rgba(0, 0, 0, 0.02);
	display: flex;
	flex-direction: column;
	gap: 10px;
	h3 {
		margin: 0 0 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #64748b;
	}
}

.kg-bom-wb__stat-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	border-radius: 6px;
	border: 1px solid #e2e8f0;
	background: #fff;
	font-size: 11px;
	color: #64748b;
	strong {
		font-size: 18px;
		color: #0f172a;
		&.is-green {
			color: #059669;
		}
	}
	&.is-primary {
		border-color: rgba(59, 130, 246, 0.25);
		background: rgba(59, 130, 246, 0.05);
		strong {
			color: var(--el-color-primary);
		}
	}
	&.is-danger {
		border-color: #fecaca;
		background: #fef2f2;
		strong {
			color: #dc2626;
		}
	}
}

.kg-bom-wb__manifest-table-wrap {
	flex: 1;
	overflow: auto;
	padding: 16px;
	min-width: 0;
}

.kg-bom-wb__manifest-empty {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 13px;
	color: #94a3b8;
}

.kg-bom-wb__manifest-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
	thead {
		position: sticky;
		top: 0;
		background: #f1f5f9;
		th {
			padding: 8px 16px;
			font-size: 11px;
			text-transform: uppercase;
			color: #64748b;
			text-align: left;
			&.is-right {
				text-align: right;
			}
		}
	}
	tbody tr {
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
		&:hover {
			background: rgba(0, 0, 0, 0.02);
		}
	}
	td {
		padding: 10px 16px;
		&.is-bold {
			font-weight: 500;
		}
		&.mono {
			font-family: ui-monospace, monospace;
			font-size: 12px;
			color: #64748b;
		}
		&.is-right {
			text-align: right;
		}
	}
}

.kg-delta {
	font-size: 11px;
	padding: 2px 8px;
	border-radius: 4px;
	&.is-conflict {
		background: #fee2e2;
		color: #b91c1c;
		border: 1px solid #fecaca;
	}
	&.is-new {
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
	}
}

.kg-badge {
	display: inline-block;
	padding: 2px 8px;
	font-size: 11px;
	border-radius: 4px;
}
.kg-badge--success {
	background: #ecfdf5;
	color: #047857;
	border: 1px solid #a7f3d0;
}

.kg-icon-btn {
	width: 36px;
	height: 36px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	&:hover {
		background: #f8fafc;
		color: var(--el-color-primary);
	}
	&.is-danger:hover {
		color: #dc2626;
		background: #fef2f2;
		border-color: #fecaca;
	}
}
</style>
