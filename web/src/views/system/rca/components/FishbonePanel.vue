<template>
	<div class="kg-fishbone">
		<div class="kg-fishbone__spine">
			<span class="kg-fishbone__effect">{{ effect }}</span>
		</div>
		<div class="kg-fishbone__grid">
			<div v-for="cat in categories" :key="cat" class="kg-fishbone__cat">
				<div class="kg-fishbone__cat-title">{{ cat }}</div>
				<div v-for="node in data[cat]" :key="node.id" class="kg-fishbone__node">
					<el-input
						:model-value="node.text"
						size="small"
						@update:model-value="(v: string) => emit('update', cat, node.id, v)"
					/>
					<el-button
						:type="node.isMainCause ? 'warning' : 'default'"
						size="small"
						link
						@click="emit('toggleMain', cat, node.id)"
					>
						{{ t('message.pages.rca.mainCause') }}
					</el-button>
					<el-button size="small" link type="danger" @click="emit('remove', cat, node.id)">
						<el-icon><Delete /></el-icon>
					</el-button>
				</div>
				<el-button size="small" link type="primary" @click="emit('add', cat)">
					+ {{ t('message.pages.rca.addCause') }}
				</el-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="FishbonePanel">
import { useI18n } from 'vue-i18n';
import { Delete } from '@element-plus/icons-vue';
import type { CauseNode } from '../types';

defineProps<{
	categories: string[];
	data: Record<string, CauseNode[]>;
	effect: string;
}>();

const emit = defineEmits<{
	update: [cat: string, id: string, text: string];
	toggleMain: [cat: string, id: string];
	remove: [cat: string, id: string];
	add: [cat: string];
}>();

const { t } = useI18n();
</script>

<style scoped lang="scss">
.kg-fishbone__spine {
	background: var(--el-color-primary-light-8);
	border-radius: 8px;
	padding: 12px 16px;
	margin-bottom: 16px;
}
.kg-fishbone__effect {
	font-weight: 600;
}
.kg-fishbone__grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 12px;
}
.kg-fishbone__cat {
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 8px;
	padding: 10px;
}
.kg-fishbone__cat-title {
	font-size: 12px;
	font-weight: 600;
	margin-bottom: 8px;
	color: var(--el-color-primary);
}
.kg-fishbone__node {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 6px;
}
</style>
