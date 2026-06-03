<template>
	<div class="kg-workflow-page">
		<div class="kg-workflow-page__head">
			<div>
				<h1>审批流配置</h1>
				<p>为文档类型配置线性审批步骤，上传文档时可选择绑定并在列表中手动触发。</p>
			</div>
			<el-button type="primary" @click="openCreate">新建审批流</el-button>
		</div>

		<el-table v-loading="loading" :data="definitions" border class="kg-workflow-page__table">
			<el-table-column prop="name" label="名称" min-width="160" />
			<el-table-column prop="code" label="编码" min-width="140" />
			<el-table-column prop="doc_type_name" label="文档类型" min-width="140">
				<template #default="{ row }">{{ row.doc_type_name || '—' }}</template>
			</el-table-column>
			<el-table-column label="审批步骤" min-width="220">
				<template #default="{ row }">
					<span v-if="!row.steps?.length">—</span>
					<span v-else>{{ row.steps.map((s: WorkflowStep) => s.assignee_name || s.assignee_id).join(' → ') }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="is_active" label="状态" width="90">
				<template #default="{ row }">
					<el-tag :type="row.is_active ? 'success' : 'info'" size="small">
						{{ row.is_active ? '启用' : '停用' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="160" fixed="right">
				<template #default="{ row }">
					<el-button link type="primary" @click="openEdit(row)">编辑</el-button>
					<el-button link type="danger" @click="onDelete(row.id)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<el-dialog v-model="dialogVisible" :title="editingId ? '编辑审批流' : '新建审批流'" width="640px" @closed="resetForm">
			<el-form label-position="top">
				<el-form-item label="名称" required>
					<el-input v-model="form.name" placeholder="如：8D报告审批流" />
				</el-form-item>
				<el-form-item label="编码" required>
					<el-input v-model="form.code" placeholder="如：8d_report" :disabled="!!editingId" />
				</el-form-item>
				<el-form-item label="绑定文档类型">
					<el-select v-model="form.doc_type_id" clearable class="w100" placeholder="可选">
						<el-option v-for="opt in documentTypes" :key="opt.id" :label="opt.name" :value="opt.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="启用">
					<el-switch v-model="form.is_active" />
				</el-form-item>
				<el-form-item label="审批步骤" required>
					<div v-for="(step, index) in form.steps" :key="index" class="kg-workflow-step">
						<span class="kg-workflow-step__order">第 {{ index + 1 }} 步</span>
						<el-select
							v-model="step.assignee_id"
							filterable
							:loading="usersLoading"
							placeholder="选择审批人"
							class="kg-workflow-step__user"
						>
							<el-option v-for="u in users" :key="u.id" :label="u.name || u.username" :value="u.id" />
						</el-select>
						<el-input v-model="step.step_name" placeholder="步骤名称（可选）" class="kg-workflow-step__name" />
						<el-button v-if="form.steps.length > 1" link type="danger" @click="removeStep(index)">删除</el-button>
					</div>
					<el-button class="mt8" @click="addStep">添加步骤</el-button>
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
import { GetList } from '/@/views/system/user/api';

type UserOption = { id: number; name: string; username: string };

const loading = ref(false);
const saving = ref(false);
const definitions = ref<WorkflowDefinition[]>([]);
const documentTypes = ref<DocumentType[]>([]);
const users = ref<UserOption[]>([]);
const usersLoading = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
	name: '',
	code: '',
	doc_type_id: undefined as number | undefined,
	is_active: true,
	steps: [{ step_order: 1, assignee_id: undefined as number | undefined, step_name: '' }] as WorkflowStep[],
});

async function loadDefinitions() {
	loading.value = true;
	try {
		definitions.value = (await fetchWorkflowDefinitions()) || [];
	} catch {
		ElMessage.error('加载审批流失败');
	} finally {
		loading.value = false;
	}
}

async function loadUsers() {
	usersLoading.value = true;
	try {
		const res = (await GetList({ limit: 999, page: 1, show_all: '1' } as Parameters<typeof GetList>[0])) as {
			data?: UserOption[];
		};
		const list = Array.isArray(res?.data) ? res.data : [];
		users.value = list.map((item) => ({
			id: item.id,
			name: item.name || item.username,
			username: item.username,
		}));
		if (!users.value.length) {
			ElMessage.warning('未加载到系统用户，请确认账号权限');
		}
	} catch {
		users.value = [];
		ElMessage.error('加载用户列表失败');
	} finally {
		usersLoading.value = false;
	}
}

async function loadMeta() {
	documentTypes.value = (await fetchDocumentTypes()) || [];
	await loadUsers();
}

function resetForm() {
	editingId.value = null;
	form.value = {
		name: '',
		code: '',
		doc_type_id: undefined,
		is_active: true,
		steps: [{ step_order: 1, assignee_id: undefined, step_name: '' }],
	};
}

function openCreate() {
	resetForm();
	dialogVisible.value = true;
	loadUsers();
}

function openEdit(row: WorkflowDefinition) {
	editingId.value = row.id;
	form.value = {
		name: row.name,
		code: row.code,
		doc_type_id: row.doc_type_id || undefined,
		is_active: row.is_active,
		steps: row.steps?.length
			? row.steps.map((s) => ({ ...s }))
			: [{ step_order: 1, assignee_id: undefined, step_name: '' }],
	};
	dialogVisible.value = true;
	loadUsers();
}

function addStep() {
	form.value.steps.push({
		step_order: form.value.steps.length + 1,
		assignee_id: undefined,
		step_name: '',
	});
}

function removeStep(index: number) {
	form.value.steps.splice(index, 1);
	form.value.steps.forEach((s, i) => {
		s.step_order = i + 1;
	});
}

async function saveDefinition() {
	if (!form.value.name.trim() || !form.value.code.trim()) {
		ElMessage.warning('请填写名称和编码');
		return;
	}
	if (!form.value.steps.length || form.value.steps.some((s) => !s.assignee_id)) {
		ElMessage.warning('请为每一步选择审批人');
		return;
	}
	saving.value = true;
	try {
		const payload = {
			name: form.value.name.trim(),
			code: form.value.code.trim(),
			doc_type_id: form.value.doc_type_id ?? null,
			is_active: form.value.is_active,
			steps: form.value.steps.map((s, i) => ({
				step_order: i + 1,
				assignee_id: s.assignee_id as number,
				step_name: s.step_name || '',
			})),
		};
		if (editingId.value) {
			await updateWorkflowDefinition(editingId.value, payload);
		} else {
			await createWorkflowDefinition(payload);
		}
		dialogVisible.value = false;
		ElMessage.success('保存成功');
		await loadDefinitions();
	} catch {
		ElMessage.error('保存失败');
	} finally {
		saving.value = false;
	}
}

async function onDelete(id: number) {
	try {
		await ElMessageBox.confirm('确定删除该审批流？', '提示', { type: 'warning' });
		await deleteWorkflowDefinition(id);
		ElMessage.success('已删除');
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

.kg-workflow-step {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 8px;
	flex-wrap: wrap;
}

.kg-workflow-step__order {
	width: 64px;
	font-size: 13px;
	color: #64748b;
}

.kg-workflow-step__user {
	width: 180px;
}

.kg-workflow-step__name {
	flex: 1;
	min-width: 160px;
}

.w100 {
	width: 100%;
}

.mt8 {
	margin-top: 8px;
}
</style>
