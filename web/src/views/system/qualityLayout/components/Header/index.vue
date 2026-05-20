<template>
	<header class="kg-header">
		<span class="kg-header__title">{{ pageTitle }}</span>
	</header>
</template>

<script setup lang="ts" name="kgHeader">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
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
	border-bottom: 1px solid var(--el-border-color-lighter);
	background: var(--el-bg-color);
}
.kg-header__title {
	font-size: 15px;
	font-weight: 600;
	color: var(--el-text-color-primary);
}
</style>
