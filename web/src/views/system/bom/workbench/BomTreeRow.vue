<template>
	<div class="kg-tree-row-wrap">
		<div
			class="kg-tree-row"
			:class="{ 'is-match': isMatched }"
		>
			<div class="kg-tree-row__indent" :style="{ width: `${node.level * 20}px` }" />
			<div class="kg-tree-row__chev">
				<button
					v-if="node.children?.length"
					type="button"
					@click.stop="emit('toggleExpand', node.id)"
				>
					<el-icon v-if="expandedIds.has(node.id)"><ArrowDown /></el-icon>
					<el-icon v-else><ArrowRight /></el-icon>
				</button>
			</div>
			<div
				class="kg-tree-row__chk"
				@click="emit('toggleSelect', node, selectionState !== 'all')"
			>
				<span class="kg-chk" :class="chkClass">
					<el-icon v-if="selectionState === 'all'"><Check /></el-icon>
					<span v-else-if="selectionState === 'partial'" class="kg-chk__bar" />
				</span>
			</div>
			<div class="kg-tree-row__name">
				<span class="kg-tree-row__title" :title="node.name">{{ node.name }}</span>
				<span class="kg-tree-row__code">{{ node.code }}</span>
			</div>
			<div class="kg-tree-row__lvl">L{{ node.level }}</div>
			<div class="kg-tree-row__spec" :title="node.spec">{{ node.spec }}</div>
			<div class="kg-tree-row__st">
				<span class="kg-node-badge" :class="node.status === 'Ingested' ? 'is-ingested' : ''">
					{{ node.status === 'Ingested' ? t('message.pages.bom.statusIngested') : t('message.pages.bom.statusPendingNode') }}
				</span>
			</div>
		</div>
		<template v-if="expandedIds.has(node.id) && node.children?.length">
			<BomTreeRow
				v-for="child in node.children"
				:key="child.id"
				:node="child"
				:expanded-ids="expandedIds"
				:search-query="searchQuery"
				:get-selection-state="getSelectionState"
				@toggle-expand="emit('toggleExpand', $event)"
				@toggle-select="(n, s) => emit('toggleSelect', n, s)"
			/>
		</template>
	</div>
</template>

<script setup lang="ts" name="BomTreeRow">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue';
import type { BomTreeNode } from '../types';

const props = defineProps<{
	node: BomTreeNode;
	expandedIds: Set<string>;
	searchQuery: string;
	getSelectionState: (node: BomTreeNode) => 'none' | 'partial' | 'all';
}>();

const emit = defineEmits<{
	toggleExpand: [id: string];
	toggleSelect: [node: BomTreeNode, select: boolean];
}>();

const { t } = useI18n();

const selectionState = computed(() => props.getSelectionState(props.node));

const isMatched = computed(() => {
	const q = props.searchQuery.trim().toLowerCase();
	if (!q) return false;
	return props.node.name.toLowerCase().includes(q) || props.node.code.toLowerCase().includes(q);
});

const chkClass = computed(() => ({
	'is-all': selectionState.value === 'all',
	'is-partial': selectionState.value === 'partial',
}));
</script>

<style scoped lang="scss">
.kg-tree-row {
	display: flex;
	align-items: center;
	padding: 6px 8px;
	font-size: 13px;
	border-bottom: 1px solid transparent;
	&:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	&.is-match {
		background: rgba(59, 130, 246, 0.06);
		box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.15);
	}
}

.kg-tree-row__indent {
	flex-shrink: 0;
}

.kg-tree-row__chev {
	width: 20px;
	flex-shrink: 0;
	button {
		border: none;
		background: none;
		padding: 0;
		cursor: pointer;
		color: #64748b;
		display: flex;
		align-items: center;
		&:hover {
			color: #0f172a;
		}
	}
}

.kg-tree-row__chk {
	width: 24px;
	flex-shrink: 0;
	display: flex;
	justify-content: center;
	cursor: pointer;
}

.kg-chk {
	width: 16px;
	height: 16px;
	border: 1px solid #cbd5e1;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	transition: all 0.15s;
	&.is-all {
		background: var(--el-color-primary);
		border-color: var(--el-color-primary);
		color: #fff;
		font-size: 12px;
	}
	&.is-partial {
		background: rgba(59, 130, 246, 0.2);
		border-color: var(--el-color-primary);
	}
}

.kg-chk__bar {
	width: 8px;
	height: 2px;
	background: var(--el-color-primary);
	border-radius: 1px;
}

.kg-tree-row__name {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-tree-row__title {
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kg-tree-row__code {
	font-size: 11px;
	font-family: ui-monospace, monospace;
	color: #64748b;
	background: #f1f5f9;
	padding: 2px 6px;
	border-radius: 4px;
	flex-shrink: 0;
}

.kg-tree-row__lvl {
	width: 48px;
	text-align: center;
	font-size: 12px;
	color: #64748b;
	flex-shrink: 0;
}

.kg-tree-row__spec {
	width: 80px;
	font-size: 12px;
	color: #64748b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	flex-shrink: 0;
	padding-right: 8px;
}

.kg-tree-row__st {
	width: 80px;
	flex-shrink: 0;
	display: flex;
	justify-content: flex-end;
}

.kg-node-badge {
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 4px;
	border: 1px solid #e2e8f0;
	color: #64748b;
	&.is-ingested {
		background: #eff6ff;
		color: #1d4ed8;
		border-color: #bfdbfe;
	}
}
</style>
