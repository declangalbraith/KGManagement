<template>
	<div class="kg-wf-design">
		<div class="fd-nav">
			<div class="fd-nav-left">
				<button type="button" class="fd-nav-back" @click="goBack">
					<el-icon><ArrowLeft /></el-icon>
				</button>
				<div class="fd-nav-title">{{ workFlowDef.name || '—' }}</div>
			</div>
			<div class="fd-nav-right">
				<el-button type="primary" class="button-publish" :loading="saving" @click="saveSet">保存</el-button>
			</div>
		</div>
		<div v-loading="loading" class="fd-nav-content">
			<section class="dingflow-design">
				<div class="zoom">
					<div class="zoom-out" :class="{ disabled: nowVal === 50 }" @click="zoomSize(1)" />
					<span>{{ nowVal }}%</span>
					<div class="zoom-in" :class="{ disabled: nowVal === 300 }" @click="zoomSize(2)" />
				</div>
				<div class="box-scale" :style="{ transform: `scale(${nowVal / 100})` }">
					<nodeWrap v-model:node-config="nodeConfig" v-model:flow-permission="flowPermission" />
					<div class="end-node">
						<div class="end-node-circle" />
						<div class="end-node-text">流程结束</div>
					</div>
				</div>
			</section>
		</div>
		<errorDialog v-model:visible="tipVisible" :list="tipList" />
		<promoterDrawer />
		<approverDrawer :director-max-level="directorMaxLevel" />
		<copyerDrawer />
		<conditionDrawer />
	</div>
</template>

<script setup lang="ts" name="kg-approval-workflow-design">
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useBreadcrumbExtras } from '/@/stores/breadcrumbExtras';
import { fetchWorkflowDefinition, fetchWorkflowDesign, saveWorkflowDesign } from '/@/api/workflow/index';
import { useWorkflowDesignerStore } from '../designer/store/workflowDesignerStore';
import nodeWrap from '../designer/components/nodeWrap.vue';
import errorDialog from '../designer/components/dialog/errorDialog.vue';
import promoterDrawer from '../designer/components/drawer/promoterDrawer.vue';
import approverDrawer from '../designer/components/drawer/approverDrawer.vue';
import copyerDrawer from '../designer/components/drawer/copyerDrawer.vue';
import conditionDrawer from '../designer/components/drawer/conditionDrawer.vue';

type DesignTip = { name: string; type: string };
type NodeConfig = Record<string, unknown>;

const route = useRoute();
const router = useRouter();
const breadcrumbExtras = useBreadcrumbExtras();
const designerStore = useWorkflowDesignerStore();

const definitionId = computed(() => Number(route.params.id));
const loading = ref(true);
const saving = ref(false);
const tipVisible = ref(false);
const tipList = ref<DesignTip[]>([]);
const nowVal = ref(100);
const processConfig = ref<Record<string, unknown>>({});
const nodeConfig = ref<NodeConfig>({});
const workFlowDef = ref<{ id?: number; name?: string; code?: string }>({});
const flowPermission = ref<unknown[]>([]);
const directorMaxLevel = ref(4);

function syncBreadcrumb(name: string) {
	if (name.trim()) {
		breadcrumbExtras.set([{ title: name.trim() }]);
	}
}

async function loadDefinitionMeta() {
	const def = await fetchWorkflowDefinition(definitionId.value);
	workFlowDef.value = { id: def.id, name: def.name, code: def.code };
	syncBreadcrumb(def.name);
}

async function loadDesign() {
	loading.value = true;
	try {
		const data = await fetchWorkflowDesign(definitionId.value);
		processConfig.value = data as Record<string, unknown>;
		nodeConfig.value = (data.nodeConfig as NodeConfig) || {};
		flowPermission.value = (data.flowPermission as unknown[]) || [];
		directorMaxLevel.value = (data.directorMaxLevel as number) || 4;
		if (data.workFlowDef) {
			workFlowDef.value = data.workFlowDef;
			syncBreadcrumb(data.workFlowDef.name || '');
		}
		designerStore.setTableId(data.tableId ?? definitionId.value);
	} catch {
		ElMessage.error('加载流程设计失败');
	} finally {
		loading.value = false;
	}
}

watch(
	() => route.params.id,
	async () => {
		if (!definitionId.value) return;
		await Promise.all([loadDefinitionMeta(), loadDesign()]);
	}
);

onMounted(async () => {
	const app = getCurrentInstance()?.appContext.app;
	app?.directive('focus', {
		mounted(el: HTMLElement) {
			el.focus();
		},
	});

	if (!definitionId.value) {
		router.replace('/approval-workflow');
		return;
	}
	await Promise.all([loadDefinitionMeta(), loadDesign()]);
});

onUnmounted(() => {
	breadcrumbExtras.clear();
	designerStore.setIsTried(false);
});

function goBack() {
	router.push('/approval-workflow');
}

function reErr(node: { childNode?: NodeConfig } | null) {
	if (!node?.childNode) return;
	const child = node.childNode;
	const { type, error, nodeName, conditionNodes, childNode } = child;
	if (type === 1 || type === 2) {
		if (error) {
			tipList.value.push({
				name: (nodeName as string) || '',
				type: ['', '审核人', '抄送人'][type as number] || '',
			});
		}
		reErr(child);
	} else if (type === 3) {
		reErr(child);
	} else if (type === 4) {
		reErr(child);
		for (let i = 0; i < ((conditionNodes as NodeConfig[])?.length || 0); i++) {
			const cond = (conditionNodes as NodeConfig[])[i];
			if (cond.error) {
				tipList.value.push({ name: (cond.nodeName as string) || '条件', type: '条件' });
			}
			reErr(cond);
		}
	}
}

async function saveSet() {
	designerStore.setIsTried(true);
	tipList.value = [];
	reErr({ childNode: nodeConfig.value });

	if (tipList.value.length) {
		tipVisible.value = true;
		return;
	}

	processConfig.value = {
		...processConfig.value,
		nodeConfig: nodeConfig.value,
		flowPermission: flowPermission.value,
		directorMaxLevel: directorMaxLevel.value,
	};

	saving.value = true;
	try {
		const res = await saveWorkflowDesign(definitionId.value, {
			nodeConfig: nodeConfig.value,
			flowPermission: flowPermission.value,
			directorMaxLevel: directorMaxLevel.value,
		});
		if (Array.isArray(res.runtime_warnings) && res.runtime_warnings.length) {
			ElMessage.warning(res.runtime_warnings[0] as string);
		}
		ElMessage.success('保存成功');
	} catch {
		ElMessage.error('保存失败');
	} finally {
		saving.value = false;
	}
}

function zoomSize(type: number) {
	if (type === 1) {
		if (nowVal.value === 50) return;
		nowVal.value -= 10;
	} else {
		if (nowVal.value === 300) return;
		nowVal.value += 10;
	}
}
</script>

<style>
@import '../designer/css/workflow.css';

/* workflow.css 会改 body 背景，离开页面后由布局自身背景覆盖 */
body {
	background: var(--next-bg-main-color, #f8f8f8);
}

.kg-wf-design {
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	height: calc(100vh - 160px);
	min-height: 520px;
	margin: -24px -28px 0;
	background: #f1f2f3;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 8px;
	isolation: isolate;
}

/* 覆盖开源全屏 fixed 布局，约束在内容区 */
.kg-wf-design .fd-nav {
	position: relative;
	top: auto;
	left: auto;
	right: auto;
	flex-shrink: 0;
	z-index: 5;
}

.kg-wf-design .fd-nav-content {
	position: relative;
	top: auto;
	left: auto;
	right: auto;
	bottom: auto;
	flex: 1;
	min-height: 0;
	overflow: auto;
	z-index: 1;
	padding-bottom: 48px;
}

.kg-wf-design .dingflow-design {
	position: relative;
	min-height: 100%;
	padding-top: 8px;
}

.kg-wf-design .zoom {
	position: absolute;
	top: 16px;
	right: 16px;
	margin-top: 0;
	z-index: 4;
}

/* 抽屉 / 弹窗遮罩限制在设计器容器内 */
.kg-wf-design :deep(.el-overlay) {
	position: absolute !important;
	inset: 0 !important;
}

.kg-wf-design :deep(.el-drawer) {
	position: absolute !important;
}

.kg-wf-design :deep(.el-dialog) {
	--el-dialog-margin-top: 8vh;
}

.kg-wf-design :deep(.el-overlay-dialog) {
	position: absolute !important;
	inset: 0 !important;
}

.kg-wf-design .button-publish {
	min-width: 88px;
}

.kg-wf-design .fd-nav-back {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60px;
	height: 60px;
	border: none;
	background: transparent;
	color: #fff;
	cursor: pointer;
	padding: 0;
}

.kg-wf-design .fd-nav-back:hover {
	background: #5af;
}
</style>
