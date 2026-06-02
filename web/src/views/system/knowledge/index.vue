<template>
	<div class="kg-kb">
		<div class="kg-kb__head">
			<div class="kg-kb__head-left">
				<div class="kg-kb__title-icon">
					<el-icon><Reading /></el-icon>
				</div>
				<div>
					<h1 class="kg-kb__title">{{ t('message.pages.knowledge.title') }}</h1>
					<p class="kg-kb__subtitle">{{ t('message.pages.knowledge.subtitle') }}</p>
				</div>
			</div>
			<div class="kg-kb__tabs">
				<button
					v-for="tab in tabs"
					:key="tab.key"
					type="button"
					class="kg-kb__tab"
					:class="{ 'is-active': activeTab === tab.key }"
					@click="activeTab = tab.key"
				>
					<el-icon><component :is="tab.icon" /></el-icon>
					{{ t(tab.label) }}
				</button>
			</div>
		</div>

		<!-- 知识检索 -->
		<div v-if="activeTab === 'retrieval'" class="kg-kb__retrieval">
			<section class="kg-kb__hero">
				<div class="kg-kb__hero-bg" aria-hidden="true" />
				<div class="kg-kb__hero-inner">
					<span class="kg-kb__hero-badge">
						<el-icon><MagicStick /></el-icon>
						{{ t('message.pages.knowledge.heroTag') }}
					</span>
					<h2 class="kg-kb__hero-title">{{ t('message.pages.knowledge.heroTitle') }}</h2>
					<p class="kg-kb__hero-desc">{{ t('message.pages.knowledge.heroSubtitle') }}</p>

					<div class="kg-kb__search">
						<el-icon class="kg-kb__search-icon"><Search /></el-icon>
						<input
							v-model="searchQuery"
							class="kg-kb__search-input"
							:placeholder="t('message.pages.knowledge.searchPlaceholder')"
							@keydown.enter="doSearch"
						/>
						<button type="button" class="kg-kb__search-btn" :disabled="searching" @click="doSearch">
							<span v-if="searching" class="kg-kb__search-spinner" />
							{{ t('message.pages.knowledge.search') }}
						</button>
					</div>

					<div class="kg-kb__hot">
						<span>{{ t('message.pages.knowledge.hotTopics') }}:</span>
						<button
							v-for="topic in hotTopics"
							:key="topic"
							type="button"
							class="kg-kb__hot-tag"
							@click="searchQuery = topic"
						>
							{{ topic }}
						</button>
					</div>
				</div>
			</section>

			<div class="kg-kb__grid">
				<aside class="kg-kb__sidebar">
					<div class="kg-kb__panel kg-glass">
						<div class="kg-kb__panel-head">
							<el-icon><Reading /></el-icon>
							<span>{{ t('message.pages.knowledge.categories') }}</span>
						</div>
						<ul class="kg-kb__cat-list">
							<li v-for="cat in knowledgeCategories" :key="cat">
								<button type="button" class="kg-kb__cat-btn" @click="onCategory(cat)">
									<span>{{ cat }}</span>
									<el-icon><ArrowRight /></el-icon>
								</button>
							</li>
						</ul>
					</div>

					<div class="kg-kb__panel kg-glass">
						<div class="kg-kb__panel-head">
							<el-icon class="is-blue"><Document /></el-icon>
							<span>{{ t('message.pages.knowledge.latestDocs') }}</span>
						</div>
						<div class="kg-kb__latest">
							<template v-for="(doc, idx) in latestQualityDocs" :key="doc.id">
								<router-link :to="doc.path" class="kg-kb__latest-item">
									<span class="kg-kb__doc-tag" :class="doc.tagClass">{{ doc.tag }}</span>
									<span class="kg-kb__latest-title">{{ doc.title }}</span>
									<span class="kg-kb__latest-time">
										<el-icon><Clock /></el-icon>
										{{ doc.updatedLabel }}
									</span>
								</router-link>
								<div v-if="idx < latestQualityDocs.length - 1" class="kg-kb__latest-divider" />
							</template>
							<button type="button" class="kg-kb__enter-docs" @click="router.push('/document-management?tab=general-doc')">
								{{ t('message.pages.knowledge.enterDocs') }}
								<el-icon><ArrowRight /></el-icon>
							</button>
						</div>
					</div>
				</aside>

				<div class="kg-kb__main">
					<div class="kg-kb__main-head">
						<h3>
							<el-icon><TrendCharts /></el-icon>
							{{ t('message.pages.knowledge.recommended') }}
						</h3>
						<button type="button" class="kg-kb__view-all" @click="onViewAll">
							{{ t('message.pages.knowledge.viewAll') }}
							<el-icon><ArrowRight /></el-icon>
						</button>
					</div>
					<div class="kg-kb__cards">
						<article
							v-for="item in recommendedKnowledge"
							:key="item.id"
							class="kg-kb__card kg-glass"
							@click="openDoc(item)"
						>
							<div class="kg-kb__card-top">
								<span class="kg-kb__doc-tag" :class="item.tagClass">{{ item.tag }}</span>
								<span class="kg-kb__rating">
									<el-icon><StarFilled /></el-icon>
									{{ item.rating }}
								</span>
							</div>
							<h4>{{ item.title }}</h4>
							<p>{{ item.summary }}</p>
							<footer>
								<div class="kg-kb__author">
									<span class="kg-kb__avatar">{{ item.authorInitial }}</span>
									<span>{{ item.author }}</span>
									<span class="kg-kb__dot">·</span>
									<span>{{ item.date }}</span>
								</div>
								<span class="kg-kb__views">
									<el-icon><Reading /></el-icon>
									{{ item.views }}
								</span>
							</footer>
						</article>
					</div>
				</div>
			</div>
		</div>

		<!-- 知识图谱 -->
		<div v-else-if="activeTab === 'graph'" class="kg-kb__graph-wrap">
			<KnowledgeGraph />
		</div>

		<!-- 图谱构建 -->
		<div v-else-if="activeTab === 'builder'" class="kg-kb__builder-wrap">
			<KnowledgeGraphBuilder />
		</div>

		<!-- 知识管理 -->
		<KnowledgeManagement v-else />

		<DocumentViewer
			v-model="viewerOpen"
			:title="activeDocTitle"
			:watermark-text="viewerWatermark"
			doc-type="pdf"
		>
			<div class="kg-kb__doc-content">
				<h2>{{ activeDocTitle }}</h2>
				<p>{{ t('message.pages.knowledge.docPreviewHint') }}</p>
				<p>{{ t('message.pages.knowledge.docPreviewBody') }}</p>
				<div class="kg-kb__doc-box">
					<h3>{{ t('message.pages.knowledge.docPreviewPoints') }}</h3>
					<ul>
						<li>{{ t('message.pages.knowledge.docPoint1') }}</li>
						<li>{{ t('message.pages.knowledge.docPoint2') }}</li>
						<li>{{ t('message.pages.knowledge.docPoint3') }}</li>
					</ul>
				</div>
			</div>
		</DocumentViewer>
	</div>
</template>

<script setup lang="ts" name="kg-knowledge-index">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowRight,
	Clock,
	Connection,
	Document,
	MagicStick,
	Reading,
	Search,
	Setting,
	StarFilled,
	Tools,
	TrendCharts,
} from '@element-plus/icons-vue';
import KnowledgeGraph from '/@/views/system/common/components/KnowledgeGraph/index.vue';
import KnowledgeGraphBuilder from './components/KnowledgeGraphBuilder.vue';
import KnowledgeManagement from './components/KnowledgeManagement.vue';
import DocumentViewer from '../generalDoc/components/DocumentViewer.vue';
import {
	hotTopics,
	knowledgeCategories,
	latestQualityDocs,
	recommendedKnowledge,
} from './mock';
import type { RecommendedKnowledge } from './types';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

type TabKey = 'retrieval' | 'graph' | 'builder' | 'management';

const tabs: { key: TabKey; label: string; icon: typeof Search }[] = [
	{ key: 'retrieval', label: 'message.pages.knowledge.tabRetrieval', icon: Search },
	{ key: 'graph', label: 'message.pages.knowledge.tabGraph', icon: Connection },
	{ key: 'builder', label: 'message.pages.knowledge.tabBuilder', icon: Tools },
	{ key: 'management', label: 'message.pages.knowledge.tabManagement', icon: Setting },
];

const activeTab = ref<TabKey>(route.params.id ? 'graph' : 'retrieval');
const searchQuery = ref('');
const searching = ref(false);
const viewerOpen = ref(false);
const activeDocTitle = ref('');

const viewerWatermark = computed(() => {
	const date = new Date().toISOString().split('T')[0];
	return `CONFIDENTIAL - QCONNECT - ${date}`;
});

function doSearch() {
	if (!searchQuery.value.trim()) return;
	searching.value = true;
	setTimeout(() => {
		searching.value = false;
		ElMessage.success(`${t('message.pages.knowledge.searchDone')} — "${searchQuery.value}"`);
	}, 800);
}

function onCategory(cat: string) {
	ElMessage.info(cat);
}

function onViewAll() {
	ElMessage.info(t('message.pages.knowledge.viewAllToast'));
}

function openDoc(item: RecommendedKnowledge | { title: string; id?: string }) {
	activeDocTitle.value = item.title;
	viewerOpen.value = true;
}
</script>

<style scoped lang="scss">
.kg-glass {
	background: rgba(255, 255, 255, 0.98);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	border-radius: 12px;
}

.kg-kb {
	max-width: 1280px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.kg-kb__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
}

.kg-kb__head-left {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	min-width: 0;
}

.kg-kb__title-icon {
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: rgba(59, 130, 246, 0.1);
	color: var(--el-color-primary);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22px;
	flex-shrink: 0;
}

.kg-kb__title {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #0f172a;
	font-family: Georgia, 'Times New Roman', serif;
}

.kg-kb__subtitle {
	margin: 8px 0 0;
	font-size: 14px;
	color: #64748b;
	line-height: 1.5;
}

.kg-kb__tabs {
	display: flex;
	gap: 4px;
	padding: 4px;
	background: #f1f5f9;
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 12px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	flex-shrink: 0;
	flex-wrap: wrap;
}

.kg-kb__tab {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border: none;
	background: transparent;
	padding: 8px 20px;
	font-size: 14px;
	color: #64748b;
	border-radius: 8px;
	cursor: pointer;
	white-space: nowrap;
	transition: background 0.15s, color 0.15s, box-shadow 0.15s;
	&.is-active {
		background: #1a1a1a;
		color: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}
	&:not(.is-active):hover {
		background: rgba(255, 255, 255, 0.7);
		color: #334155;
	}
}

.kg-kb__retrieval {
	display: flex;
	flex-direction: column;
	gap: 32px;
}

.kg-kb__hero {
	position: relative;
	overflow: hidden;
	border-radius: 24px;
	border: 1px solid rgba(0, 0, 0, 0.06);
	background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, #fff 45%, #f8fafc 100%);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	padding: 48px 24px;
	text-align: center;
}

.kg-kb__hero-bg {
	position: absolute;
	inset: 0;
	pointer-events: none;
	&::before {
		content: '';
		position: absolute;
		top: -96px;
		right: -96px;
		width: 384px;
		height: 384px;
		border-radius: 50%;
		background: rgba(59, 130, 246, 0.12);
		filter: blur(48px);
	}
	&::after {
		content: '';
		position: absolute;
		bottom: -72px;
		left: -72px;
		width: 288px;
		height: 288px;
		border-radius: 50%;
		background: rgba(37, 99, 235, 0.08);
		filter: blur(40px);
	}
}

.kg-kb__hero-inner {
	position: relative;
	z-index: 1;
	max-width: 720px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
}

.kg-kb__hero-badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 16px;
	border-radius: 999px;
	border: 1px solid rgba(59, 130, 246, 0.25);
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(6px);
	font-size: 13px;
	color: var(--el-color-primary);
	font-weight: 500;
}

.kg-kb__hero-title {
	margin: 0;
	font-size: clamp(28px, 4vw, 44px);
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #0f172a;
	font-family: Georgia, 'Times New Roman', serif;
	line-height: 1.15;
}

.kg-kb__hero-desc {
	margin: 0;
	font-size: 16px;
	color: #64748b;
	line-height: 1.65;
	max-width: 560px;
}

.kg-kb__search {
	position: relative;
	width: 100%;
	max-width: 640px;
	margin-top: 8px;
}

.kg-kb__search-icon {
	position: absolute;
	left: 20px;
	top: 50%;
	transform: translateY(-50%);
	font-size: 20px;
	color: #94a3b8;
	z-index: 2;
}

.kg-kb__search-input {
	width: 100%;
	height: 56px;
	padding: 0 120px 0 52px;
	border: 2px solid rgba(0, 0, 0, 0.08);
	border-radius: 999px;
	font-size: 16px;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(6px);
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s;
	&:focus {
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
	}
}

.kg-kb__search-btn {
	position: absolute;
	right: 6px;
	top: 6px;
	height: 44px;
	padding: 0 28px;
	border: none;
	border-radius: 999px;
	background: #1a1a1a;
	color: #fff;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
	transition: background 0.15s;
	&:hover:not(:disabled) {
		background: #333;
	}
	&:disabled {
		opacity: 0.7;
		cursor: wait;
	}
}

.kg-kb__search-spinner {
	display: inline-block;
	width: 14px;
	height: 14px;
	margin-right: 6px;
	border: 2px solid rgba(255, 255, 255, 0.35);
	border-top-color: #fff;
	border-radius: 50%;
	animation: kg-spin 0.7s linear infinite;
	vertical-align: middle;
}

@keyframes kg-spin {
	to {
		transform: rotate(360deg);
	}
}

.kg-kb__hot {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
	> span {
		font-size: 13px;
		color: #64748b;
		font-weight: 500;
	}
}

.kg-kb__hot-tag {
	border: 1px solid rgba(0, 0, 0, 0.08);
	background: rgba(255, 255, 255, 0.6);
	backdrop-filter: blur(4px);
	padding: 4px 12px;
	border-radius: 999px;
	font-size: 13px;
	color: #475569;
	cursor: pointer;
	transition: background 0.15s, color 0.15s, border-color 0.15s;
	&:hover {
		background: #1a1a1a;
		color: #fff;
		border-color: #1a1a1a;
	}
}

.kg-kb__grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 24px;
	@media (min-width: 900px) {
		grid-template-columns: 280px 1fr;
	}
}

.kg-kb__sidebar {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.kg-kb__panel {
	transition: box-shadow 0.2s;
	&:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
	}
}

.kg-kb__panel-head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 16px 18px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	font-size: 16px;
	font-weight: 600;
	color: #0f172a;
	.el-icon.is-blue {
		color: #2563eb;
	}
}

.kg-kb__cat-list {
	list-style: none;
	margin: 0;
	padding: 8px;
}

.kg-kb__cat-btn {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 10px 14px;
	border: none;
	background: transparent;
	border-radius: 10px;
	font-size: 14px;
	color: #334155;
	text-align: left;
	cursor: pointer;
	.el-icon {
		opacity: 0;
		transition: opacity 0.15s;
		color: #94a3b8;
	}
	&:hover {
		background: rgba(59, 130, 246, 0.06);
		color: var(--el-color-primary);
		.el-icon {
			opacity: 1;
		}
	}
}

.kg-kb__latest {
	padding: 16px 18px 14px;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.kg-kb__latest-item {
	display: flex;
	flex-direction: column;
	gap: 4px;
	text-decoration: none;
	color: inherit;
	&:hover .kg-kb__latest-title {
		color: var(--el-color-primary);
	}
}

.kg-kb__latest-title {
	font-size: 14px;
	font-weight: 500;
	line-height: 1.4;
	color: #0f172a;
	transition: color 0.15s;
}

.kg-kb__latest-time {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: #94a3b8;
}

.kg-kb__latest-divider {
	height: 1px;
	background: rgba(0, 0, 0, 0.06);
	margin: -4px 0;
}

.kg-kb__enter-docs {
	align-self: flex-start;
	border: none;
	background: transparent;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: var(--el-color-primary);
	cursor: pointer;
	padding: 4px 0;
	&:hover {
		text-decoration: underline;
	}
}

.kg-kb__doc-tag {
	display: inline-block;
	font-size: 10px;
	font-weight: 600;
	padding: 2px 6px;
	border-radius: 4px;
	width: fit-content;
	&.is-blue {
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
	}
	&.is-green {
		background: #ecfdf5;
		color: #047857;
		border: 1px solid #a7f3d0;
	}
}

.kg-kb__main-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	margin-bottom: 20px;
	h3 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 20px;
		font-weight: 700;
		color: #0f172a;
		font-family: Georgia, 'Times New Roman', serif;
	}
}

.kg-kb__view-all {
	border: none;
	background: transparent;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 13px;
	color: var(--el-color-primary);
	cursor: pointer;
	padding: 6px 12px;
	border-radius: 999px;
	&:hover {
		background: rgba(59, 130, 246, 0.08);
	}
}

.kg-kb__cards {
	display: grid;
	gap: 20px;
	@media (min-width: 720px) {
		grid-template-columns: repeat(2, 1fr);
	}
}

.kg-kb__card {
	padding: 24px;
	display: flex;
	flex-direction: column;
	min-height: 220px;
	cursor: pointer;
	border: 1px solid transparent;
	transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
		border-color: rgba(59, 130, 246, 0.2);
	}
	h4 {
		margin: 0 0 10px;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.35;
		color: #0f172a;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		transition: color 0.15s;
	}
	&:hover h4 {
		color: var(--el-color-primary);
	}
	p {
		margin: 0;
		flex: 1;
		font-size: 13px;
		color: #64748b;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 20px;
		padding-top: 14px;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		font-size: 12px;
		color: #94a3b8;
	}
}

.kg-kb__card-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 14px;
}

.kg-kb__rating {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 8px;
	border-radius: 999px;
	background: #f1f5f9;
	font-size: 12px;
	color: #64748b;
	.el-icon {
		color: #eab308;
	}
}

.kg-kb__author {
	display: flex;
	align-items: center;
	gap: 6px;
}

.kg-kb__avatar {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: rgba(59, 130, 246, 0.12);
	color: var(--el-color-primary);
	font-size: 11px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
}

.kg-kb__dot {
	color: #cbd5e1;
}

.kg-kb__views {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 8px;
	border-radius: 999px;
	background: #f8fafc;
}

.kg-kb__tab-panel {
	padding: 20px;
	min-height: 320px;
}

.kg-kb__graph-wrap {
	min-height: 750px;
}

.kg-kb__builder-wrap {
	min-height: 800px;
}

.kg-kb__doc-content {
	h2 {
		font-size: 22px;
		font-weight: 700;
		margin: 0 0 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid #e2e8f0;
	}
	p {
		margin: 0 0 12px;
		line-height: 1.65;
		color: #334155;
	}
}

.kg-kb__doc-box {
	margin-top: 16px;
	padding: 16px;
	background: #f1f5f9;
	border-radius: 8px;
	h3 {
		margin: 0 0 8px;
		font-size: 15px;
		font-weight: 600;
	}
	ul {
		margin: 0;
		padding-left: 20px;
		line-height: 1.7;
		color: #475569;
	}
}
</style>
