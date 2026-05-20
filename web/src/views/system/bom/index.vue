<template>
	<div class="kg-bom">
		<div class="kg-bom__head">
			<div>
				<h1>{{ t('message.pages.bom.title') }}</h1>
				<p>{{ t('message.pages.bom.subtitle') }}</p>
			</div>
			<el-button type="primary"><el-icon><Plus /></el-icon>{{ t('message.pages.bom.create') }}</el-button>
		</div>
		<el-card shadow="never">
			<el-input v-model="searchQuery" :placeholder="t('message.pages.bom.searchPlaceholder')" clearable class="mb-3" style="max-width: 360px">
				<template #prefix><el-icon><Search /></el-icon></template>
			</el-input>
			<el-table :data="filtered" stripe>
				<el-table-column prop="name" :label="t('message.pages.bom.colName')" min-width="200" />
				<el-table-column prop="code" :label="t('message.pages.bom.colCode')" width="140" />
				<el-table-column prop="version" :label="t('message.pages.bom.colVersion')" width="80" />
				<el-table-column prop="deviceModel" :label="t('message.pages.bom.colModel')" width="160" />
				<el-table-column prop="productLine" :label="t('message.pages.bom.colLine')" width="140" />
				<el-table-column prop="status" :label="t('message.pages.bom.colStatus')" width="90">
					<template #default="{ row }">
						<el-tag :type="row.status === 'Active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="ingestStatus" :label="t('message.pages.bom.colIngest')" width="100" />
				<el-table-column prop="uploader" :label="t('message.pages.bom.colUploader')" width="100" />
				<el-table-column width="200" fixed="right">
					<template #default="{ row }">
						<el-button link type="primary" @click="router.push(`/bom-management/${row.id}/extract`)">
							{{ t('message.pages.bom.extract') }}
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-bom-index">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Plus, Search } from '@element-plus/icons-vue';
import { bomList } from './mock';

const { t } = useI18n();
const router = useRouter();
const searchQuery = ref('');

const filtered = computed(() => {
	if (!searchQuery.value) return bomList;
	const q = searchQuery.value.toLowerCase();
	return bomList.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
});
</script>

<style scoped lang="scss">
.kg-bom__head {
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
.mb-3 {
	margin-bottom: 12px;
}
</style>
