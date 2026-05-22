<template>
	<aside class="kg-sidebar">
		<div class="kg-sidebar__brand">
			<div class="kg-sidebar__brand-row">
				<span class="kg-sidebar__logo">KNORR-BREMSE</span>
				<span class="kg-sidebar__subtitle">Quality Center</span>
			</div>
		</div>
		<nav class="kg-sidebar__nav">
			<router-link
				v-for="item in navItems"
				:key="item.path"
				:to="item.path"
				class="kg-sidebar__link"
				:class="{ 'is-active': isActive(item.path) }"
			>
				<span v-if="isActive(item.path)" class="kg-sidebar__indicator" aria-hidden="true" />
				<el-icon class="kg-sidebar__icon"><component :is="item.icon" /></el-icon>
				<span class="kg-sidebar__label">{{ item.label }}</span>
			</router-link>
		</nav>
	</aside>
</template>

<script setup lang="ts" name="kgSidebar">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
	Connection,
	DataAnalysis,
	Document,
	Odometer,
	Reading,
	Setting,
	Tickets,
	View,
} from '@element-plus/icons-vue';

const route = useRoute();
const { t } = useI18n();

const navItems = computed(() => [
	{ path: '/home', label: t('message.pages.qualityLayout.sidebar.dashboard'), icon: Odometer },
	{ path: '/issues', label: t('message.pages.qualityLayout.sidebar.issues'), icon: Tickets },
	{ path: '/document-management', label: t('message.pages.qualityLayout.sidebar.documents'), icon: Document },
	{ path: '/schema', label: t('message.pages.qualityLayout.sidebar.schema'), icon: Connection },
	{ path: '/knowledge', label: t('message.pages.qualityLayout.sidebar.knowledge'), icon: Reading },
	{ path: '/analytics', label: t('message.pages.qualityLayout.sidebar.analytics'), icon: DataAnalysis },
	{ path: '/admin', label: t('message.pages.qualityLayout.sidebar.admin'), icon: Setting },
	{ path: '/audit', label: t('message.pages.qualityLayout.sidebar.audit'), icon: View },
]);

function isActive(path: string) {
	const p = route.path;
	if (path === '/home') return p === '/home' || p === '/';
	return p === path || p.startsWith(`${path}/`);
}
</script>

<style scoped lang="scss">
.kg-sidebar {
	width: 256px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	background: #fff;
	border-right: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 1px 0 10px rgba(0, 0, 0, 0.02);
	z-index: 10;
	min-height: 100%;
}

.kg-sidebar__brand {
	height: 64px;
	display: flex;
	align-items: center;
	padding: 0 24px;
	margin-bottom: 16px;
	flex-shrink: 0;
}

.kg-sidebar__brand-row {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.kg-sidebar__logo {
	flex-shrink: 0;
	font-family: ui-sans-serif, system-ui, sans-serif;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	padding: 4px 8px;
	background: #1a1a1a;
	color: #fff;
	border-radius: 2px;
	white-space: nowrap;
	line-height: 1.2;
}

.kg-sidebar__subtitle {
	font-size: 14px;
	font-weight: 600;
	color: #64748b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kg-sidebar__nav {
	flex: 1;
	overflow-y: auto;
	padding: 8px 16px 24px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.kg-sidebar__link {
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	color: #8c8c8c;
	text-decoration: none;
	transition: background 0.2s, color 0.2s;
	overflow: hidden;

	&:hover:not(.is-active) {
		background: rgba(0, 0, 0, 0.04);
		color: #334155;
		.kg-sidebar__icon {
			color: #475569;
		}
	}

	&.is-active {
		background: #f0f0f0;
		color: #1a1a1a;
		.kg-sidebar__icon {
			color: #1a1a1a;
		}
	}
}

.kg-sidebar__indicator {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 4px;
	background: #1a1a1a;
	border-radius: 0 4px 4px 0;
}

.kg-sidebar__icon {
	font-size: 16px;
	color: #8c8c8c;
	transition: color 0.2s;
	flex-shrink: 0;
}

.kg-sidebar__label {
	line-height: 1.3;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
