<template>
	<div class="kg-root">
		<Sidebar />
		<div class="kg-main">
			<Header />
			<main class="kg-content">
				<router-view />
			</main>
		</div>
		<QueenAssistant />
	</div>
</template>

<script setup lang="ts" name="qualityLayout">
import Sidebar from './components/Sidebar/index.vue';
import Header from './components/Header/index.vue';
import QueenAssistant from './components/QueenAssistant/index.vue';
</script>

<style scoped lang="scss">
.kg-root {
	display: flex;
	width: 100%;
	min-height: calc(100vh - 85px);
	background: var(--el-bg-color);
}
.kg-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
	overflow: hidden;
}
.kg-content {
	flex: 1;
	overflow: auto;
	padding: 16px 20px;
}
</style>
