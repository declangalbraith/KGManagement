<template>
	<div class="kg-8d">
		<div class="kg-8d__head">
			<el-button circle @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
			<div>
				<h1>{{ t('message.pages.report8d.title') }}</h1>
				<p>
					{{ t('message.pages.report8d.linkedIssue') }}:
					<el-link type="primary" @click="router.push(`/issues/${issueId}`)">{{ issueId }}</el-link>
				</p>
			</div>
			<div class="kg-8d__actions">
				<el-button @click="syncFromIssue">{{ t('message.pages.report8d.syncFromIssue') }}</el-button>
				<el-button @click="fillAiMock">{{ t('message.pages.report8d.aiDraft') }}</el-button>
				<el-button :loading="saving" @click="save">{{ t('message.pages.report8d.save') }}</el-button>
				<el-button type="primary" :loading="submitting" @click="submit">{{ t('message.pages.report8d.submit') }}</el-button>
			</div>
		</div>

		<el-alert :title="t('message.pages.report8d.aiHint')" type="info" show-icon :closable="false" class="mb-3" />

		<el-card v-for="sec in sectionMeta" :key="sec.key" shadow="never" class="mb-3">
			<template #header>{{ sec.title }}</template>
			<el-input v-model="reportData[sec.key]" type="textarea" :rows="sec.key === 'd2' ? 5 : 4" />
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-report8d-index">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { defaultReport8D, sectionMeta } from './mock';
import type { Report8DState } from './types';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const issueId = computed(() => (route.params.id as string) || 'ISS-202604-001');
const reportData = reactive<Report8DState>({ ...defaultReport8D });
const saving = ref(false);
const submitting = ref(false);

function save() {
	saving.value = true;
	setTimeout(() => {
		saving.value = false;
		ElMessage.success(t('message.pages.report8d.saved'));
	}, 400);
}

function submit() {
	submitting.value = true;
	setTimeout(() => {
		submitting.value = false;
		ElMessage.success(t('message.pages.report8d.submitted'));
	}, 500);
}

function syncFromIssue() {
	reportData.d2 = defaultReport8D.d2;
	ElMessage.success(t('message.pages.report8d.synced'));
}

function fillAiMock() {
	reportData.d3 = '对已发现问题列车实施临时限速与抽检，暂停同批次闸瓦装配。';
	reportData.d4 = '同批次闸瓦材质硬度超标；入厂检验执行不到位。';
	reportData.d5 = '更换合格批次物料；加强来料检验频次。';
	reportData.d6 = '完成装车验证 5000km，磨损指标恢复正常。';
	reportData.d7 = '更新供应商质量协议与 SOP。';
	reportData.d8 = '质量委员会确认结案。';
	ElMessage.success(t('message.pages.report8d.aiHint'));
}
</script>

<style scoped lang="scss">
.kg-8d__head {
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
	}
}
.kg-8d__actions {
	margin-left: auto;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
.mb-3 {
	margin-bottom: 16px;
}
</style>
