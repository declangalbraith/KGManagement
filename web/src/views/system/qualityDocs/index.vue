<template>
	<div class="kg-qdocs">
		<div class="kg-qdocs__head">
			<div>
				<h1>{{ t('message.pages.qualityDocs.title') }}</h1>
				<p>{{ t('message.pages.qualityDocs.subtitle') }}</p>
			</div>
			<el-button type="primary" @click="router.push('/quality-docs/new')">
				<el-icon><Plus /></el-icon>{{ t('message.pages.qualityDocs.upload') }}
			</el-button>
		</div>
		<el-card shadow="never">
			<div class="kg-qdocs__toolbar">
				<el-input v-model="searchQuery" :placeholder="t('message.pages.qualityDocs.searchPlaceholder')" clearable style="max-width: 320px">
					<template #prefix><el-icon><Search /></el-icon></template>
				</el-input>
				<el-radio-group v-model="viewMode" size="small">
					<el-radio-button value="active">{{ t('message.pages.qualityDocs.viewActive') }}</el-radio-button>
					<el-radio-button value="archived">{{ t('message.pages.qualityDocs.viewArchived') }}</el-radio-button>
					<el-radio-button value="deleted">{{ t('message.pages.qualityDocs.viewDeleted') }}</el-radio-button>
				</el-radio-group>
			</div>
			<el-table :data="filtered" stripe @row-click="(row) => router.push(`/quality-docs/${row.id}`)">
				<el-table-column prop="uniqueId" :label="t('message.pages.qualityDocs.colId')" width="130" />
				<el-table-column prop="name" :label="t('message.pages.qualityDocs.colName')" min-width="180" />
				<el-table-column prop="fileType" :label="t('message.pages.qualityDocs.colType')" width="100" />
				<el-table-column prop="docNumber" :label="t('message.pages.qualityDocs.colNumber')" width="140" />
				<el-table-column prop="owner" :label="t('message.pages.qualityDocs.colOwner')" width="100" />
				<el-table-column prop="status" :label="t('message.pages.qualityDocs.colStatus')" width="100">
					<template #default="{ row }">
						<el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="version" :label="t('message.pages.qualityDocs.colVersion')" width="80" />
				<el-table-column prop="updateDate" :label="t('message.pages.qualityDocs.colUpdated')" width="120" />
			</el-table>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-quality-docs-index">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Plus, Search } from '@element-plus/icons-vue';
import type { DocViewMode } from './types';
import { mockQualityDocs } from './mock';

const { t } = useI18n();
const router = useRouter();
const searchQuery = ref('');
const viewMode = ref<DocViewMode>('active');
const docs = ref([...mockQualityDocs]);

const filtered = computed(() => {
	let list = docs.value;
	if (searchQuery.value) {
		const q = searchQuery.value.toLowerCase();
		list = list.filter((d) => d.name.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q));
	}
	return list;
});

function statusType(s: string) {
	if (s === 'APPROVED') return 'success';
	if (s === 'DRAFT') return 'info';
	if (s === 'PENDING') return 'warning';
	return 'danger';
}
</script>

<style scoped lang="scss">
.kg-qdocs__head {
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
.kg-qdocs__toolbar {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12px;
	flex-wrap: wrap;
	gap: 12px;
}
</style>
