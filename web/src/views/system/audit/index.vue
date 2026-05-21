<template>
	<div class="kg-audit">
		<div class="kg-audit__head">
			<div>
				<h1>{{ t('message.pages.audit.title') }}</h1>
				<p>{{ t('message.pages.audit.subtitle') }}</p>
			</div>
			<el-button :loading="exporting" @click="doExport">
				<el-icon><Download /></el-icon>{{ t('message.pages.audit.export') }}
			</el-button>
		</div>
		<el-card shadow="never">
			<div class="kg-audit__toolbar">
				<el-input v-model="searchQuery" :placeholder="t('message.pages.audit.searchPlaceholder')" clearable style="max-width: 320px">
					<template #prefix><el-icon><Search /></el-icon></template>
				</el-input>
				<el-select v-model="moduleFilter" clearable :placeholder="t('message.pages.audit.filterModule')" style="width: 140px">
					<el-option label="问题管理" value="问题管理" />
					<el-option label="8D报告" value="8D报告" />
					<el-option label="数据分析" value="数据分析" />
				</el-select>
			</div>
			<el-table :data="filtered" stripe>
				<el-table-column prop="time" :label="t('message.pages.audit.colTime')" width="170" />
				<el-table-column prop="user" :label="t('message.pages.audit.colUser')" width="100" />
				<el-table-column prop="action" :label="t('message.pages.audit.colAction')" width="100" />
				<el-table-column prop="module" :label="t('message.pages.audit.colModule')" width="110" />
				<el-table-column prop="target" :label="t('message.pages.audit.colTarget')" min-width="160" />
				<el-table-column prop="ip" :label="t('message.pages.audit.colIp')" width="130" />
			</el-table>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-audit-index">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Download, Search } from '@element-plus/icons-vue';
import { auditLogs } from './mock';

const { t } = useI18n();
const searchQuery = ref('');
const moduleFilter = ref('');
const exporting = ref(false);

const filtered = computed(() => {
	let list = auditLogs;
	if (moduleFilter.value) list = list.filter((l) => l.module === moduleFilter.value);
	if (searchQuery.value) {
		const q = searchQuery.value;
		list = list.filter((l) => l.user.includes(q) || l.target.includes(q) || l.action.includes(q) || l.module.includes(q));
	}
	return list;
});

function doExport() {
	exporting.value = true;
	setTimeout(() => {
		exporting.value = false;
		ElMessage.success(t('message.pages.audit.exportSuccess'));
	}, 600);
}
</script>

<style scoped lang="scss">
.kg-audit__head {
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
.kg-audit__toolbar {
	display: flex;
	gap: 12px;
	margin-bottom: 12px;
	flex-wrap: wrap;
}
</style>
