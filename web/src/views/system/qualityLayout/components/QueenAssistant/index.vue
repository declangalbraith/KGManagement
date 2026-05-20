<template>
	<el-button class="kg-queen-fab" type="primary" circle size="large" @click="open = true">
		<el-icon><MagicStick /></el-icon>
	</el-button>
	<el-drawer v-model="open" title="Queen 助手" direction="rtl" size="380px">
		<p class="kg-queen-hint">智能伴写与问答助手，完整对话请前往 AI 助手页。</p>
		<el-input v-model="quickAsk" type="textarea" :rows="3" placeholder="输入问题，@Q 召唤..." />
		<el-button type="primary" class="mt-2" @click="goAi">发送</el-button>
		<el-divider />
		<el-button link type="primary" @click="router.push('/ai-assistant')">打开 AI 助手</el-button>
	</el-drawer>
</template>

<script setup lang="ts" name="kgQueenAssistant">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { MagicStick } from '@element-plus/icons-vue';

const router = useRouter();
const open = ref(false);
const quickAsk = ref('');

function goAi() {
	open.value = false;
	router.push({ path: '/ai-assistant', query: quickAsk.value ? { q: quickAsk.value } : {} });
}
</script>

<style scoped lang="scss">
.kg-queen-fab {
	position: fixed;
	right: 24px;
	bottom: 24px;
	z-index: 100;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.kg-queen-hint {
	font-size: 13px;
	color: var(--el-text-color-secondary);
	margin: 0 0 12px;
}
.mt-2 {
	margin-top: 8px;
}
</style>
