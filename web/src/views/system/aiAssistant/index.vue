<template>
	<div class="kg-ai">
		<div class="kg-ai__head">
			<h1>{{ t('message.pages.aiAssistant.title') }}</h1>
			<p>{{ t('message.pages.aiAssistant.subtitle') }}</p>
		</div>
		<el-card class="kg-ai__chat" shadow="never">
			<div ref="scrollRef" class="kg-ai__messages">
				<div class="kg-ai__msg kg-ai__msg--ai">
					<el-avatar :size="36">AI</el-avatar>
					<div class="kg-ai__bubble">
						<p>{{ t('message.pages.aiAssistant.greeting') }}</p>
						<ul>
							<li v-for="(s, i) in suggestions" :key="i" @click="input = s">{{ s }}</li>
						</ul>
					</div>
				</div>
				<div v-for="msg in messages" :key="msg.id" class="kg-ai__msg" :class="msg.role === 'user' ? 'kg-ai__msg--user' : 'kg-ai__msg--ai'">
					<el-avatar :size="36">{{ msg.role === 'user' ? '我' : 'AI' }}</el-avatar>
					<div class="kg-ai__bubble">{{ msg.content }}</div>
				</div>
			</div>
			<div class="kg-ai__input">
				<el-input v-model="input" type="textarea" :rows="2" :placeholder="t('message.pages.aiAssistant.placeholder')" @keyup.enter.ctrl="send" />
				<el-button type="primary" :loading="sending" @click="send">{{ t('message.pages.aiAssistant.send') }}</el-button>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-ai-assistant-index">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

const { t, tm } = useI18n();
const route = useRoute();
const input = ref('');

onMounted(() => {
	const q = route.query.q;
	if (typeof q === 'string' && q.trim()) input.value = q;
});
const sending = ref(false);
const scrollRef = ref<HTMLElement | null>(null);
const messages = ref<{ id: string; role: 'user' | 'ai'; content: string }[]>([]);

const suggestions = computed(() => {
	const raw = tm('message.pages.aiAssistant.suggestions');
	return Array.isArray(raw) ? (raw as string[]) : [];
});

async function send() {
	if (!input.value.trim()) return;
	const text = input.value;
	messages.value.push({ id: String(Date.now()), role: 'user', content: text });
	input.value = '';
	sending.value = true;
	await nextTick();
	if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
	setTimeout(() => {
		messages.value.push({
			id: String(Date.now() + 1),
			role: 'ai',
			content: `已收到您的问题。当前为 Mock 模式，对接 LLM 后将基于图谱检索「${text}」并返回答案。`,
		});
		sending.value = false;
		ElMessage.success(t('message.pages.aiAssistant.sent'));
		nextTick(() => {
			if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
		});
	}, 700);
}
</script>

<style scoped lang="scss">
.kg-ai__head {
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
.kg-ai__chat {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 200px);
	min-height: 480px;
}
.kg-ai__messages {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}
.kg-ai__msg {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
	&--user {
		flex-direction: row-reverse;
		.kg-ai__bubble {
			background: var(--el-color-primary-light-9);
		}
	}
}
.kg-ai__bubble {
	flex: 1;
	max-width: 85%;
	padding: 12px 16px;
	background: var(--el-fill-color-light);
	border-radius: 12px;
	font-size: 14px;
	line-height: 1.6;
	ul {
		margin: 8px 0 0;
		padding-left: 18px;
	}
	li {
		cursor: pointer;
		color: var(--el-color-primary);
		margin-bottom: 4px;
	}
}
.kg-ai__input {
	display: flex;
	gap: 8px;
	padding: 12px 16px;
	border-top: 1px solid var(--el-border-color-lighter);
	align-items: flex-end;
}
</style>
