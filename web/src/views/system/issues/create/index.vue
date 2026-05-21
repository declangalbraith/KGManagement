<template>
	<div class="kg-issue-create">
		<div class="kg-issue-create__head">
			<el-button circle @click="router.back()">
				<el-icon><ArrowLeft /></el-icon>
			</el-button>
			<div>
				<h1>{{ t('message.pages.issues.createTitle') }}</h1>
				<p>{{ t('message.pages.issues.createSubtitle') }}</p>
			</div>
		</div>

		<el-card shadow="never" class="mb-4">
			<template #header>{{ t('message.pages.issues.basicInfo') }}</template>
			<el-form label-position="top">
				<el-form-item label="问题标题" required>
					<el-input v-model="form.title" placeholder="简明扼要地描述问题..." />
				</el-form-item>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="问题分类" required>
							<el-select v-model="form.category" placeholder="请选择" class="w100">
								<el-option label="质量投诉" value="质量投诉" />
								<el-option label="技术咨询" value="技术咨询" />
								<el-option label="现场支持" value="现场支持" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="涉及产品" required>
							<el-select v-model="form.product" placeholder="请选择" class="w100">
								<el-option label="制动盘" value="制动盘" />
								<el-option label="空压机" value="空压机" />
								<el-option label="控制阀" value="控制阀" />
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>
				<el-form-item label="问题详细描述" required>
					<el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述问题现象..." />
				</el-form-item>
			</el-form>
		</el-card>

		<el-card shadow="never">
			<template #header>{{ t('message.pages.issues.flowConfig') }}</template>
			<div class="kg-issue-create__flow">
				<div><span>启动 8D 流程</span><el-switch v-model="form.enable8d" /></div>
				<div><span>发起根因分析</span><el-switch v-model="form.enableRca" /></div>
			</div>
			<div class="kg-issue-create__footer">
				<el-button :loading="isSaving" @click="saveDraft">{{ t('message.pages.issues.saveDraft') }}</el-button>
				<el-button type="primary" :loading="isSubmitting" @click="submit">
					{{ t('message.pages.issues.submit') }}
				</el-button>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-issues-create">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';

const router = useRouter();
const { t } = useI18n();
const isSubmitting = ref(false);
const isSaving = ref(false);
const form = reactive({
	title: '',
	category: '',
	product: '',
	description: '',
	enable8d: false,
	enableRca: true,
});

function submit() {
	isSubmitting.value = true;
	setTimeout(() => {
		isSubmitting.value = false;
		ElMessage.success(t('message.pages.issues.submitSuccess'));
		router.push('/issues');
	}, 600);
}

function saveDraft() {
	isSaving.value = true;
	setTimeout(() => {
		isSaving.value = false;
		ElMessage.success(t('message.pages.issues.draftSaved'));
	}, 400);
}
</script>

<style scoped lang="scss">
.kg-issue-create__head {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	h1 {
		margin: 0;
		font-size: 22px;
	}
	p {
		margin: 4px 0 0;
		color: var(--el-text-color-secondary);
		font-size: 14px;
	}
}
.kg-issue-create__flow > div {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid var(--el-border-color-lighter);
}
.kg-issue-create__footer {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 16px;
}
.w100 {
	width: 100%;
}
.mb-4 {
	margin-bottom: 16px;
}
</style>
