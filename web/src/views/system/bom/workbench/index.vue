<template>
	<div class="kg-bom-wb">
		<div class="kg-bom-wb__head">
			<el-button @click="router.push('/bom-management')">
				<el-icon><ArrowLeft /></el-icon>
				{{ t('message.pages.bom.back') }}
			</el-button>
			<div>
				<h1>{{ t('message.pages.bom.workbench') }}</h1>
				<p>{{ t('message.pages.bom.workbenchSubtitle') }} · {{ bomId }}</p>
			</div>
			<el-button type="primary" :loading="extracting" @click="runExtract">
				{{ t('message.pages.bom.runExtract') }}
			</el-button>
		</div>
		<el-row :gutter="16">
			<el-col :span="10">
				<el-card shadow="never">
					<template #header>{{ t('message.pages.bom.tree') }}</template>
					<el-tree :data="[workbenchTree]" :props="treeProps" default-expand-all node-key="id">
						<template #default="{ data }">
							<span class="kg-bom-wb__node">
								{{ data.name }}
								<el-tag size="small" :type="data.status === 'Ingested' ? 'success' : 'warning'">{{ data.status }}</el-tag>
							</span>
						</template>
					</el-tree>
				</el-card>
			</el-col>
			<el-col :span="14">
				<el-card shadow="never">
					<template #header>抽取预览</template>
					<el-table :data="flatNodes" size="small" max-height="420">
						<el-table-column prop="code" label="编码" width="120" />
						<el-table-column prop="name" label="名称" />
						<el-table-column prop="level" label="层级" width="60" />
						<el-table-column prop="spec" label="规格" width="100" />
						<el-table-column prop="status" label="状态" width="90" />
					</el-table>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="kg-bom-workbench">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import type { BomTreeNode } from '../types';
import { workbenchTree } from '../mock';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const bomId = computed(() => (route.params.id as string) || 'bom-001');
const extracting = ref(false);
const treeProps = { children: 'children', label: 'name' };

function flatten(node: BomTreeNode, acc: BomTreeNode[] = []) {
	acc.push(node);
	node.children?.forEach((c) => flatten(c, acc));
	return acc;
}

const flatNodes = computed(() => flatten(workbenchTree).filter((n) => n.id !== 'root'));

function runExtract() {
	extracting.value = true;
	setTimeout(() => {
		extracting.value = false;
		ElMessage.success(t('message.pages.bom.extractDone'));
	}, 800);
}
</script>

<style scoped lang="scss">
.kg-bom-wb__head {
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
.kg-bom-wb__node {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
</style>
