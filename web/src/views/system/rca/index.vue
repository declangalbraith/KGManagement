<template>
	<div class="kg-rca">
		<div class="kg-rca__head">
			<el-button v-if="activeTool" circle @click="activeTool = null"><el-icon><ArrowLeft /></el-icon></el-button>
			<div>
				<h1>{{ t('message.pages.rca.title') }}</h1>
				<p>{{ t('message.pages.rca.subtitle') }}</p>
				<p class="kg-rca__issue">
					{{ t('message.pages.rca.linkedIssue') }}:
					<el-link type="primary" @click="router.push(`/issues/${issueId}`)">{{ issueId }}</el-link>
				</p>
			</div>
			<div v-if="activeTool" class="kg-rca__actions">
				<el-button :loading="saving" @click="save">{{ t('message.pages.rca.save') }}</el-button>
				<el-button type="primary" :loading="confirming" @click="confirm">{{ t('message.pages.rca.confirm') }}</el-button>
			</div>
		</div>

		<template v-if="!activeTool">
			<h3 class="kg-rca__section-title">{{ t('message.pages.rca.selectTool') }}</h3>
			<el-row :gutter="16">
				<el-col v-for="tool in rcaTools" :key="tool.id" :xs="24" :sm="12" :md="8" :lg="6">
					<el-card shadow="hover" class="kg-rca__tool-card" @click="activeTool = tool.id">
						<h4>{{ tool.name }}</h4>
						<p>{{ tool.description }}</p>
					</el-card>
				</el-col>
			</el-row>
		</template>

		<template v-else-if="activeTool === 'fishbone'">
			<el-card shadow="never">
				<template #header>{{ t('message.pages.rca.fishbone') }}</template>
				<FishbonePanel
					:categories="fishboneCategories"
					:data="fishboneData"
					effect="制动盘异常磨损"
					@update="updateCause"
					@toggle-main="toggleMain"
					@remove="removeCause"
					@add="addCause"
				/>
			</el-card>
		</template>

		<template v-else-if="activeTool === '5why'">
			<el-card shadow="never">
				<template #header>{{ t('message.pages.rca.fiveWhy') }}</template>
				<div v-for="(why, idx) in fiveWhys" :key="idx" class="kg-rca__why">
					<label>Why {{ idx + 1 }}</label>
					<el-input v-model="fiveWhys[idx]" type="textarea" :rows="2" />
				</div>
			</el-card>
		</template>

		<template v-else>
			<el-card shadow="never">
				<el-empty :description="`${activeTool} 工具界面将在后续迭代完善`" />
			</el-card>
		</template>
	</div>
</template>

<script setup lang="ts" name="kg-rca-index">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import FishbonePanel from './components/FishbonePanel.vue';
import type { CauseNode } from './types';
import { defaultFishbone, fishboneCategories, rcaTools } from './mock';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const issueId = computed(() => (route.params.id as string) || 'ISS-202604-001');

const activeTool = ref<string | null>(null);
const saving = ref(false);
const confirming = ref(false);
const fishboneData = reactive<Record<string, CauseNode[]>>(JSON.parse(JSON.stringify(defaultFishbone)));
const fiveWhys = ref(['为什么制动盘磨损异常？', '为什么闸瓦磨损加剧？', '为什么闸瓦硬度偏高？', '为什么来料检验未检出？', '为什么检验标准未更新？']);

function generateId() {
	return Math.random().toString(36).slice(2, 9);
}

function updateCause(cat: string, id: string, text: string) {
	const walk = (nodes: CauseNode[]): CauseNode[] =>
		nodes.map((n) => {
			if (n.id === id) return { ...n, text };
			if (n.children) return { ...n, children: walk(n.children) };
			return n;
		});
	fishboneData[cat] = walk(fishboneData[cat]);
}

function addCause(cat: string) {
	fishboneData[cat] = [...fishboneData[cat], { id: generateId(), text: '新原因' }];
}

function removeCause(cat: string, id: string) {
	const rm = (nodes: CauseNode[]): CauseNode[] =>
		nodes.filter((n) => n.id !== id).map((n) => (n.children ? { ...n, children: rm(n.children) } : n));
	fishboneData[cat] = rm(fishboneData[cat]);
}

function toggleMain(cat: string, id: string) {
	let count = 0;
	Object.values(fishboneData).forEach((nodes) => {
		const c = (list: CauseNode[]) => {
			list.forEach((n) => {
				if (n.isMainCause) count++;
				if (n.children) c(n.children);
			});
		};
		c(nodes);
	});
	const toggle = (nodes: CauseNode[]): CauseNode[] =>
		nodes.map((n) => {
			if (n.id === id) {
				if (!n.isMainCause && count >= 3) {
					ElMessage.warning(t('message.pages.rca.maxMain'));
					return n;
				}
				return { ...n, isMainCause: !n.isMainCause };
			}
			if (n.children) return { ...n, children: toggle(n.children) };
			return n;
		});
	fishboneData[cat] = toggle(fishboneData[cat]);
}

function save() {
	saving.value = true;
	setTimeout(() => {
		saving.value = false;
		ElMessage.success(t('message.pages.rca.saved'));
	}, 400);
}

function confirm() {
	confirming.value = true;
	setTimeout(() => {
		confirming.value = false;
		ElMessage.success(t('message.pages.rca.confirmed'));
	}, 500);
}
</script>

<style scoped lang="scss">
.kg-rca__head {
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
.kg-rca__issue {
	margin-top: 4px !important;
}
.kg-rca__actions {
	margin-left: auto;
	display: flex;
	gap: 8px;
}
.kg-rca__section-title {
	font-size: 15px;
	margin: 0 0 12px;
}
.kg-rca__tool-card {
	cursor: pointer;
	margin-bottom: 16px;
	h4 {
		margin: 0 0 8px;
	}
	p {
		margin: 0;
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}
}
.kg-rca__why {
	margin-bottom: 12px;
	label {
		display: block;
		font-size: 12px;
		margin-bottom: 4px;
		color: var(--el-text-color-secondary);
	}
}
</style>
