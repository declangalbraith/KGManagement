<template>
	<div class="kg-knowledge">
		<div class="kg-knowledge__head">
			<div>
				<h1>{{ t('message.pages.knowledge.title') }}</h1>
				<p>{{ t('message.pages.knowledge.subtitle') }}</p>
			</div>
			<el-radio-group v-model="activeTab" size="default">
				<el-radio-button value="retrieval">{{ t('message.pages.knowledge.tabRetrieval') }}</el-radio-button>
				<el-radio-button value="graph">{{ t('message.pages.knowledge.tabGraph') }}</el-radio-button>
				<el-radio-button value="builder">{{ t('message.pages.knowledge.tabBuilder') }}</el-radio-button>
				<el-radio-button value="management">{{ t('message.pages.knowledge.tabManagement') }}</el-radio-button>
			</el-radio-group>
		</div>

		<template v-if="activeTab === 'retrieval'">
			<el-card shadow="never" class="kg-knowledge__hero mb-3">
				<el-tag type="primary" effect="plain">{{ t('message.pages.knowledge.heroTag') }}</el-tag>
				<h2>{{ t('message.pages.knowledge.heroTitle') }}</h2>
				<p>{{ t('message.pages.knowledge.heroSubtitle') }}</p>
				<div class="kg-knowledge__search">
					<el-input v-model="searchQuery" :placeholder="t('message.pages.knowledge.searchPlaceholder')" @keyup.enter="doSearch">
						<template #append>
							<el-button type="primary" :loading="searching" @click="doSearch">{{ t('message.pages.knowledge.search') }}</el-button>
						</template>
					</el-input>
				</div>
				<div class="kg-knowledge__hot">
					<span>{{ t('message.pages.knowledge.hotTopics') }}:</span>
					<el-tag v-for="topic in hotTopics" :key="topic" class="ml-1" @click="searchQuery = topic">{{ topic }}</el-tag>
				</div>
			</el-card>
			<el-table :data="knowledgeDocs" stripe>
				<el-table-column prop="title" :label="t('message.pages.knowledge.colTitle')" min-width="220" />
				<el-table-column prop="type" :label="t('message.pages.knowledge.colType')" width="90" />
				<el-table-column prop="category" :label="t('message.pages.knowledge.colCategory')" width="120" />
				<el-table-column prop="updatedAt" :label="t('message.pages.knowledge.colUpdated')" width="120" />
				<el-table-column prop="views" :label="t('message.pages.knowledge.colViews')" width="90" />
				<el-table-column width="100">
					<template #default="{ row }">
						<el-button link type="primary" @click="openDoc(row.title)">{{ t('message.pages.knowledge.openDoc') }}</el-button>
					</template>
				</el-table-column>
			</el-table>
		</template>

		<el-card v-else-if="activeTab === 'graph'" shadow="never">
			<KnowledgeGraph />
		</el-card>

		<el-card v-else-if="activeTab === 'builder'" shadow="never">
			<el-empty :description="t('message.pages.knowledge.builderHint')" />
			<el-button type="primary" class="mt-2" @click="router.push('/schema')">前往 Schema 设计</el-button>
		</el-card>

		<el-card v-else shadow="never">
			<el-table :data="knowledgeDocs" stripe>
				<el-table-column prop="title" :label="t('message.pages.knowledge.colTitle')" />
				<el-table-column prop="type" :label="t('message.pages.knowledge.colType')" width="90" />
				<el-table-column prop="rating" label="评分" width="80" />
				<el-table-column width="100">
					<template #default="{ row }">
						<el-button link type="primary" @click="openDoc(row.title)">{{ t('message.pages.knowledge.openDoc') }}</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>

		<el-drawer v-model="docOpen" :title="activeDocTitle" size="480px">
			<p>文档预览 Mock — 对接 DocumentViewer 后替换。</p>
		</el-drawer>
	</div>
</template>

<script setup lang="ts" name="kg-knowledge-index">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import KnowledgeGraph from '/@/views/system/common/components/KnowledgeGraph/index.vue';
import { hotTopics, knowledgeDocs } from './mock';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeTab = ref((route.params.id ? 'graph' : 'retrieval') as 'retrieval' | 'graph' | 'builder' | 'management');
const searchQuery = ref('');
const searching = ref(false);
const docOpen = ref(false);
const activeDocTitle = ref('');

function doSearch() {
	if (!searchQuery.value.trim()) return;
	searching.value = true;
	setTimeout(() => {
		searching.value = false;
		ElMessage.success(`${t('message.pages.knowledge.searchDone')} — "${searchQuery.value}"`);
	}, 600);
}

function openDoc(title: string) {
	activeDocTitle.value = title;
	docOpen.value = true;
}
</script>

<style scoped lang="scss">
.kg-knowledge__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: 12px;
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
.kg-knowledge__hero {
	text-align: center;
	h2 {
		margin: 12px 0 8px;
	}
}
.kg-knowledge__search {
	max-width: 560px;
	margin: 16px auto;
}
.kg-knowledge__hot {
	margin-top: 12px;
	font-size: 13px;
}
.mb-3 {
	margin-bottom: 16px;
}
.ml-1 {
	margin-left: 6px;
	cursor: pointer;
}
.mt-2 {
	margin-top: 12px;
}
</style>
