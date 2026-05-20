<template>
	<div class="kg-storyline">
		<div ref="scrollRef" class="kg-storyline__list">
			<div v-for="item in items" :key="item.id" class="kg-storyline__item" :class="`kg-storyline__item--${item.type}`">
				<div v-if="item.type === 'system'" class="kg-storyline__system">
					<el-icon><InfoFilled /></el-icon>
					<span>{{ item.content }}</span>
					<span class="kg-storyline__time">{{ item.timestamp }}</span>
				</div>
				<div v-else-if="item.type === 'chat'" class="kg-storyline__chat">
					<el-avatar size="small">{{ item.avatar || item.sender?.[0] }}</el-avatar>
					<div>
						<div class="kg-storyline__sender">{{ item.sender }} · {{ item.timestamp }}</div>
						<div class="kg-storyline__bubble">{{ item.content }}</div>
					</div>
				</div>
				<div v-else-if="item.type === 'file'" class="kg-storyline__file">
					<el-icon><Document /></el-icon>
					{{ item.content }}
					<span class="kg-storyline__time">{{ item.timestamp }}</span>
				</div>
				<div v-else class="kg-storyline__queen">
					<div class="kg-storyline__queen-head">
						<el-icon><MagicStick /></el-icon>
						<strong>Queen</strong>
						<span class="kg-storyline__time">{{ item.timestamp }}</span>
					</div>
					<p>{{ item.content }}</p>
					<el-tag v-if="item.widgetType === 'fishbone'" size="small" type="primary">鱼骨图</el-tag>
				</div>
			</div>
		</div>
		<div class="kg-storyline__input">
			<el-input
				v-model="inputValue"
				placeholder="输入讨论，@Q 召唤 Queen..."
				@keyup.enter="send"
			>
				<template #append>
					<el-button type="primary" @click="send">
						<el-icon><Promotion /></el-icon>
					</el-button>
				</template>
			</el-input>
		</div>
	</div>
</template>

<script setup lang="ts" name="HolographicStoryline">
import { nextTick, ref, watch } from 'vue';
import { Document, InfoFilled, MagicStick, Promotion } from '@element-plus/icons-vue';
import type { StorylineItem } from '../../types';

const props = defineProps<{
	items: StorylineItem[];
}>();

const emit = defineEmits<{
	sendMessage: [content: string];
}>();

const inputValue = ref('');
const scrollRef = ref<HTMLElement | null>(null);

function send() {
	if (!inputValue.value.trim()) return;
	emit('sendMessage', inputValue.value);
	inputValue.value = '';
}

watch(
	() => props.items.length,
	() => {
		nextTick(() => {
			if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
		});
	}
);
</script>

<style scoped lang="scss">
.kg-storyline {
	display: flex;
	flex-direction: column;
	height: 420px;
}
.kg-storyline__list {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}
.kg-storyline__item {
	margin-bottom: 12px;
}
.kg-storyline__system,
.kg-storyline__file {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	color: var(--el-text-color-secondary);
}
.kg-storyline__chat {
	display: flex;
	gap: 10px;
}
.kg-storyline__sender {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	margin-bottom: 4px;
}
.kg-storyline__bubble {
	background: var(--el-fill-color-light);
	padding: 8px 12px;
	border-radius: 8px;
	font-size: 13px;
}
.kg-storyline__queen {
	background: linear-gradient(135deg, var(--el-color-primary-light-9), transparent);
	border: 1px solid var(--el-color-primary-light-7);
	border-radius: 8px;
	padding: 10px;
	p {
		margin: 8px 0;
		font-size: 13px;
	}
}
.kg-storyline__queen-head {
	display: flex;
	align-items: center;
	gap: 6px;
}
.kg-storyline__time {
	margin-left: auto;
	font-size: 11px;
	color: var(--el-text-color-placeholder);
}
.kg-storyline__input {
	padding-top: 8px;
	border-top: 1px solid var(--el-border-color-lighter);
}
</style>
