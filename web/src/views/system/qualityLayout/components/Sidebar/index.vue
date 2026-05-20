<template>
	<aside class="kg-sidebar">
		<div class="kg-sidebar__brand">
			<span class="kg-sidebar__logo">KNORR-BREMSE</span>
			<span class="kg-sidebar__subtitle">Quality Center</span>
		</div>
		<el-menu
			:default-active="activePath"
			router
			class="kg-sidebar__menu"
		>
			<el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
				<el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
				<span>{{ item.label }}</span>
			</el-menu-item>
		</el-menu>
	</aside>
</template>

<script setup lang="ts" name="kgSidebar">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
	Odometer,
	Tickets,
	Coin,
	Connection,
	Document,
	Reading,
	DataAnalysis,
	Setting,
	View,
} from '@element-plus/icons-vue';

const route = useRoute();
const { t } = useI18n();

const navItems = computed(() => [
	{ path: '/home', label: t('message.pages.qualityLayout.sidebar.dashboard'), icon: Odometer },
	{ path: '/issues', label: t('message.pages.qualityLayout.sidebar.issues'), icon: Tickets },
	{ path: '/bom-management', label: t('message.pages.qualityLayout.sidebar.bom'), icon: Coin },
	{ path: '/schema', label: t('message.pages.qualityLayout.sidebar.schema'), icon: Connection },
	{ path: '/quality-docs', label: t('message.pages.qualityLayout.sidebar.qualityDocs'), icon: Document },
	{ path: '/knowledge', label: t('message.pages.qualityLayout.sidebar.knowledge'), icon: Reading },
	{ path: '/analytics', label: t('message.pages.qualityLayout.sidebar.analytics'), icon: DataAnalysis },
	{ path: '/admin', label: t('message.pages.qualityLayout.sidebar.admin'), icon: Setting },
	{ path: '/audit', label: t('message.pages.qualityLayout.sidebar.audit'), icon: View },
]);

const activePath = computed(() => {
	const p = route.path;
	const hit = navItems.value.find((n) => n.path !== '/home' && p.startsWith(n.path));
	return hit?.path ?? (p === '/home' || p === '/' ? '/home' : p);
});
</script>

<style scoped lang="scss">
.kg-sidebar {
	width: 220px;
	flex-shrink: 0;
	border-right: 1px solid var(--el-border-color-light);
	background: var(--el-bg-color);
	display: flex;
	flex-direction: column;
}
.kg-sidebar__brand {
	padding: 16px;
	border-bottom: 1px solid var(--el-border-color-lighter);
}
.kg-sidebar__logo {
	display: inline-block;
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 0.08em;
	padding: 4px 8px;
	background: var(--el-color-primary);
	color: #fff;
	border-radius: 2px;
}
.kg-sidebar__subtitle {
	display: block;
	margin-top: 8px;
	font-size: 12px;
	color: var(--el-text-color-secondary);
}
.kg-sidebar__menu {
	border-right: none;
	flex: 1;
}
</style>
