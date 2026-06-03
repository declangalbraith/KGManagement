<template>
	<div class="kg-workflow-page">
		<div class="kg-workflow-page__head">
			<div>
				<h1>{{ t('message.pages.approvalWorkFlow.title') }}</h1>
				<p>{{ t('message.pages.approvalWorkFlow.subtitle') }}</p>
			</div>
			<el-button type="primary" @click="openCreate">{{ t('message.pages.approvalWorkFlow.newWorkflow') }}</el-button>
		</div>

		<el-table v-loading="loading" :data="definitions" border class="kg-workflow-page__table">
			<el-table-column prop="name" :label="t('message.pages.approvalWorkFlow.name')" min-width="160" />
			<el-table-column prop="code" :label="t('message.pages.approvalWorkFlow.code')" min-width="140" />
			<el-table-column prop="doc_type_name" :label="t('message.pages.approvalWorkFlow.docType')" min-width="140">
				<template #default="{ row }">{{ row.doc_type_name || '—' }}</template>
			</el-table-column>
			<el-table-column :label="t('message.pages.approvalWorkFlow.steps')" min-width="220">
				<template #default="{ row }">
					<span v-if="!row.steps?.length">{{ t('message.pages.approvalWorkFlow.notConfigured') }}</span>
					<span v-else>{{ row.steps.map((s: WorkflowStep) => s.assignee_name || s.assignee_id).join(' → ') }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="is_active" :label="t('message.pages.approvalWorkFlow.status')" width="90">
				<template #default="{ row }">
					<el-tag :type="row.is_active ? 'success' : 'info'" size="small">
						{{ row.is_active ? '启用' : '停用' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column :label="t('message.pages.approvalWorkFlow.actions')" width="240" fixed="right">
				<template #default="{ row }">
					<el-button link type="primary" @click="openDesign(row.id)">
						{{ t('message.pages.approvalWorkFlow.openDesign') }}
					</el-button>
					<el-button link type="primary" @click="openEdit(row)">{{ t('message.pages.approvalWorkFlow.editBasic') }}</el-button>
					<el-button link type="danger" @click="onDelete(row.id)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<el-dialog
			v-model="dialogVisible"
			:title="editingId ? t('message.pages.approvalWorkFlow.editDialogTitle') : t('message.pages.approvalWorkFlow.createDialogTitle')"
			width="520px"
			@closed="resetForm"
		>
			<el-form label-position="top">
				<el-form-item :label="t('message.pages.approvalWorkFlow.name')" required>
					<el-input v-model="form.name" :placeholder="t('message.pages.approvalWorkFlow.namePlaceholder')" />
				</el-form-item>
				<el-form-item :label="t('message.pages.approvalWorkFlow.code')" required>
					<el-input
						v-model="form.code"
						:placeholder="t('message.pages.approvalWorkFlow.codePlaceholder')"
						:disabled="!!editingId"
					/>
				</el-form-item>
				<el-form-item :label="t('message.pages.approvalWorkFlow.docType')">
					<el-select v-model="form.doc_type_id" clearable class="w100" :placeholder="t('message.pages.approvalWorkFlow.docTypePlaceholder')">
						<el-option v-for="opt in documentTypes" :key="opt.id" :label="opt.name" :value="opt.id" />
					</el-select>
				</el-form-item>
				<el-form-item :label="t('message.pages.approvalWorkFlow.active')">
					<el-switch v-model="form.is_active" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="saving" @click="saveDefinition">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	createWorkflowDefinition,
	deleteWorkflowDefinition,
	fetchWorkflowDefinitions,
	updateWorkflowDefinition,
	type WorkflowDefinition,
	type WorkflowStep,
} from '/@/api/workflow/index';
import { fetchDocumentTypes, type DocumentType } from '/@/api/docManage/generalDoc';

const { t } = useI18n();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const definitions = ref<WorkflowDefinition[]>([]);
const documentTypes = ref<DocumentType[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
	name: '',
	code: '',
	doc_type_id: undefined as number | undefined,
	is_active: true,
});

async function loadDefinitions() {
	loading.value = true;
	try {
		definitions.value = (await fetchWorkflowDefinitions()) || [];
	} catch {
		ElMessage.error(t('message.pages.approvalWorkFlow.loadFailed'));
	} finally {
		loading.value = false;
	}
}

async function loadMeta() {
	documentTypes.value = (await fetchDocumentTypes()) || [];
}

function resetForm() {
	editingId.value = null;
	form.value = {
		name: '',
		code: '',
		doc_type_id: undefined,
		is_active: true,
	};
}

function openCreate() {
	resetForm();
	dialogVisible.value = true;
}

function openEdit(row: WorkflowDefinition) {
	editingId.value = row.id;
	form.value = {
		name: row.name,
		code: row.code,
		doc_type_id: row.doc_type_id || undefined,
		is_active: row.is_active,
	};
	dialogVisible.value = true;
}

function openDesign(id: number) {
	router.push(`/approval-workflow/${id}/design`);
}

async function saveDefinition() {
	if (!form.value.name.trim() || !form.value.code.trim()) {
		ElMessage.warning(t('message.pages.approvalWorkFlow.fillNameCode'));
		return;
	}
	saving.value = true;
	try {
		const payload = {
			name: form.value.name.trim(),
			code: form.value.code.trim(),
			doc_type_id: form.value.doc_type_id ?? null,
			is_active: form.value.is_active,
		};
		if (editingId.value) {
			await updateWorkflowDefinition(editingId.value, payload);
			dialogVisible.value = false;
			ElMessage.success(t('message.pages.approvalWorkFlow.saveSuccess'));
			await loadDefinitions();
		} else {
			const created = await createWorkflowDefinition(payload);
			dialogVisible.value = false;
			ElMessage.success(t('message.pages.approvalWorkFlow.saveSuccess'));
			router.push(`/approval-workflow/${created.id}/design`);
		}
	} catch {
		ElMessage.error(t('message.pages.approvalWorkFlow.saveFailed'));
	} finally {
		saving.value = false;
	}
}

async function onDelete(id: number) {
	try {
		await ElMessageBox.confirm(t('message.pages.approvalWorkFlow.deleteConfirm'), '提示', { type: 'warning' });
		await deleteWorkflowDefinition(id);
		ElMessage.success(t('message.pages.approvalWorkFlow.deleted'));
		await loadDefinitions();
	} catch {
		/* cancelled or failed */
	}
}

onMounted(async () => {
	await Promise.all([loadDefinitions(), loadMeta()]);
});
</script>

<style scoped lang="scss">
.kg-workflow-page {
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
}

.kg-workflow-page__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
	margin-bottom: 20px;

	h1 {
		margin: 0 0 8px;
		font-size: 24px;
	}

	p {
		margin: 0;
		color: #64748b;
		font-size: 14px;
	}
}

.w100 {
	width: 100%;
}
</style>
