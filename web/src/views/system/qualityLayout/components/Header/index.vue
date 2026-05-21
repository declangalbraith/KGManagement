<template>
	<header class="kg-header">
		<span class="kg-header__title">{{ pageTitle }}</span>
		<div class="kg-header__actions">
			<el-button link @click="router.push('/notifications')">
				<el-icon><Bell /></el-icon>
			</el-button>
			<el-button link @click="router.push('/ai-assistant')">
				<el-icon><ChatDotRound /></el-icon>
			</el-button>
		</div>
	</header>
</template>

<script setup lang="ts" name="kgHeader">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Bell, ChatDotRound } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const pageTitle = computed(() => {
	const title = route.meta?.title;
	if (typeof title === 'string' && title.startsWith('message.')) {
		return t(title);
	}
	return (title as string) || '';
});
</script>

<style scoped lang="scss">
.kg-header {
	height: 48px;
	padding: 0 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid var(--el-border-color-lighter);
	background: var(--el-bg-color);
}
.kg-header__actions {
	display: flex;
	gap: 4px;
}
.kg-header__title {
	font-size: 15px;
	font-weight: 600;
	color: var(--el-text-color-primary);
}
</style>
