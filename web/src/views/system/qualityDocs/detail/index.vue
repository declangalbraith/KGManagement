<template>
	<div v-if="doc" class="kg-qdocs-detail">
		<div class="kg-qdocs-detail__head">
			<el-button circle @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
			<div>
				<h1>{{ doc.name }}</h1>
				<p>{{ doc.uniqueId }} · {{ doc.docNumber }}</p>
			</div>
			<el-tag :type="doc.status === 'APPROVED' ? 'success' : 'info'">{{ doc.status }}</el-tag>
		</div>
		<el-row :gutter="16">
			<el-col :span="16">
				<el-card shadow="never" class="mb-3">
					<template #header>{{ t('message.pages.qualityDocs.basicInfo') }}</template>
					<el-descriptions :column="2" border size="small">
						<el-descriptions-item label="文件类型">{{ doc.fileType }}</el-descriptions-item>
						<el-descriptions-item label="版本">{{ doc.version }}</el-descriptions-item>
						<el-descriptions-item label="负责人">{{ doc.owner }}</el-descriptions-item>
						<el-descriptions-item label="部门">{{ doc.department }}</el-descriptions-item>
						<el-descriptions-item label="创建人">{{ doc.creatorName }}</el-descriptions-item>
						<el-descriptions-item label="更新日期">{{ doc.updateDate }}</el-descriptions-item>
						<el-descriptions-item label="描述" :span="2">{{ doc.description || '—' }}</el-descriptions-item>
					</el-descriptions>
				</el-card>
			</el-col>
			<el-col :span="8">
				<el-card shadow="never">
					<template #header>{{ t('message.pages.qualityDocs.auditLog') }}</template>
					<el-timeline>
						<el-timeline-item timestamp="2026-04-10">李四 创建文档草稿</el-timeline-item>
						<el-timeline-item timestamp="2026-04-11">李四 提交审批</el-timeline-item>
						<el-timeline-item timestamp="2026-04-12" type="success">王五 审批通过</el-timeline-item>
					</el-timeline>
				</el-card>
			</el-col>
		</el-row>
	</div>
	<el-empty v-else description="文档不存在" />
</template>

<script setup lang="ts" name="kg-quality-docs-detail">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from '@element-plus/icons-vue';
import { docById } from '../mock';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const doc = computed(() => docById((route.params.id as string) || 'doc-001'));
</script>

<style scoped lang="scss">
.kg-qdocs-detail__head {
	display: flex;
	gap: 12px;
	align-items: flex-start;
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
	margin-bottom: 16px;
}
</style>
