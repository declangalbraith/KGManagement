<template>
	<div class="kg-doc-mgmt">
		<header class="kg-doc-mgmt__head">
			<div>
				<h1 class="kg-doc-mgmt__title">{{ t('message.pages.documentManagement.title') }}</h1>
			</div>
		</header>

		<el-tabs v-model="activeTab" class="kg-doc-mgmt__tabs" @tab-change="onTabChange">
			<el-tab-pane :label="t('message.pages.documentManagement.tabBom')" name="bom">
				<KgBomIndex embedded route-prefix="/document-management" />
			</el-tab-pane>
			<el-tab-pane :label="t('message.pages.documentManagement.tabGeneralDoc')" name="general-doc">
				<KgGeneralDocIndex embedded route-prefix="/document-management" />
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup lang="ts" name="kg-document-management">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import KgBomIndex from '/@/views/system/bom/index.vue';
import KgGeneralDocIndex from '/@/views/system/generalDoc/index.vue';

type DocTab = 'bom' | 'general-doc';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeTab = ref<DocTab>('bom');

function resolveTab(tab: unknown): DocTab {
	return tab === 'general-doc' ? 'general-doc' : 'bom';
}

function syncTabFromRoute() {
	activeTab.value = resolveTab(route.query.tab);
}

watch(
	() => route.query.tab,
	() => syncTabFromRoute(),
	{ immediate: true }
);

function onTabChange(name: string | number) {
	const tab = resolveTab(name);
	if (route.query.tab === tab) return;
	router.replace({ path: '/document-management', query: { tab } });
}
</script>

<style scoped lang="scss">
.kg-doc-mgmt {
	max-width: 1280px;
	margin: 0 auto;
	padding: 0 8px 32px;
}

.kg-doc-mgmt__head {
	margin-bottom: 20px;
}

.kg-doc-mgmt__title {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #0f172a;
}

.kg-doc-mgmt__subtitle {
	margin: 8px 0 0;
	font-size: 14px;
	color: #64748b;
	max-width: 720px;
	line-height: 1.5;
}

.kg-doc-mgmt__tabs {
	:deep(.el-tabs__header) {
		margin-bottom: 20px;
	}

	:deep(.el-tabs__nav-wrap::after) {
		height: 1px;
		background: rgba(0, 0, 0, 0.06);
	}

	:deep(.el-tabs__item) {
		font-size: 14px;
		font-weight: 500;
		padding: 0 20px;
		height: 44px;
		line-height: 44px;
		color: #64748b;

		&.is-active {
			color: #0f172a;
			font-weight: 600;
		}
	}

	:deep(.el-tabs__active-bar) {
		height: 3px;
		border-radius: 3px 3px 0 0;
		background: #1a1a1a;
	}

	:deep(.el-tabs__content) {
		overflow: visible;
	}
}
</style>
