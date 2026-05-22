<template>
	<div class="kg-issue-detail">
		<IssueDetailShell @open8d="report8dOpen = true" />
		<router-view />
		<Dynamic8DReport v-model="report8dOpen" />
	</div>
</template>

<script setup lang="ts" name="kg-issues-detail-layout">
import { ref } from 'vue';
import IssueDetailShell from './IssueDetailShell.vue';
import Dynamic8DReport from './components/Dynamic8DReport.vue';

const report8dOpen = ref(false);
</script>

<style scoped lang="scss">
.kg-issue-detail {
	padding: 0 4px 32px;
	max-width: 1400px;
}
</style>
