<template>
	<el-card shadow="never">
		<el-empty :description="description">
			<template #description>
				<p class="stub-title">{{ title }}</p>
				<p class="stub-module">{{ module }}</p>
				<p class="stub-hint">{{ t('message.pages.common.stubHint') }}</p>
			</template>
		</el-empty>
	</el-card>
</template>

<script setup lang="ts" name="kgModuleStub">
import { useI18n } from 'vue-i18n';

defineProps<{
	title: string;
	module: string;
}>();

const { t } = useI18n();
const description = '';
</script>

<style scoped>
.stub-title {
	font-size: 18px;
	font-weight: 600;
	margin: 0 0 8px;
}
.stub-module {
	font-family: monospace;
	color: var(--el-text-color-secondary);
	margin: 0 0 8px;
}
.stub-hint {
	font-size: 13px;
	color: var(--el-text-color-placeholder);
	margin: 0;
}
</style>
