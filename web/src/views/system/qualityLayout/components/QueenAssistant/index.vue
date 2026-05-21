<template>
	<Teleport to="body">
		<!-- FAB：对齐 React「唤醒 KB 智能助手」 -->
		<div class="kg-kb-fab-wrap">
			<button type="button" class="kg-kb-fab" :aria-label="t('message.pages.qualityLayout.kbAssistant.wakeTooltip')" @click="toggleOpen">
				<svg class="kg-kb-fab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.636 2.106 3 3 0 0 0 .895-3.48 4 4 0 0 0-2.26-5.28A3 3 0 0 0 12 5Z" />
					<path d="M12 5v3M9 8h6M8 12h8M10 16h4" />
				</svg>
			</button>
			<div v-if="!isOpen" class="kg-kb-fab__tooltip">{{ t('message.pages.qualityLayout.kbAssistant.wakeTooltip') }}</div>
		</div>

		<Transition name="kg-kb-panel">
			<div v-if="isOpen" class="kg-kb-panel">
				<div class="kg-kb-panel__drag" />
				<header class="kg-kb-panel__head">
					<div class="kg-kb-panel__brand">
						<div class="kg-kb-panel__logo">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.636 2.106 3 3 0 0 0 .895-3.48 4 4 0 0 0-2.26-5.28A3 3 0 0 0 12 5Z" />
							</svg>
						</div>
						<div>
							<div class="kg-kb-panel__title">{{ t('message.pages.qualityLayout.kbAssistant.title') }}</div>
							<div class="kg-kb-panel__status">
								<span class="kg-kb-panel__dot" />
								{{ t('message.pages.qualityLayout.kbAssistant.systemReady') }}
							</div>
						</div>
					</div>
					<div class="kg-kb-panel__head-actions">
						<div class="kg-kb-panel__quota">
							<el-icon><Lightning /></el-icon>
							{{ tokenUsed.toLocaleString() }} / {{ tokenLimit.toLocaleString() }}
						</div>
						<el-button link @click="isOpen = false"><el-icon><Close /></el-icon></el-button>
					</div>
				</header>

				<div class="kg-kb-panel__toolbar">
					<div class="kg-kb-panel__context">
						<button
							type="button"
							class="kg-kb-ctx"
							:class="{ 'is-active': context === 'global' }"
							@click="context = 'global'"
						>
							<el-icon><Coin /></el-icon>
							{{ t('message.pages.qualityLayout.kbAssistant.contextGlobal') }}
						</button>
						<button
							type="button"
							class="kg-kb-ctx"
							:class="{ 'is-active': context === 'issue' }"
							@click="context = 'issue'"
						>
							<el-icon><Warning /></el-icon>
							{{ t('message.pages.qualityLayout.kbAssistant.contextIssue') }}
						</button>
					</div>
					<el-button link size="small" @click="onConfigSkills">
						<el-icon><Setting /></el-icon>
						{{ t('message.pages.qualityLayout.kbAssistant.configSkills') }}
					</el-button>
				</div>

				<div ref="messagesRef" class="kg-kb-panel__chat">
					<div v-for="(msg, index) in messages" :key="msg.id" class="kg-kb-msg" :class="`kg-kb-msg--${msg.role}`">
						<div class="kg-kb-msg__avatar">
							<el-icon v-if="msg.role === 'user'"><User /></el-icon>
							<el-icon v-else><Service /></el-icon>
						</div>
						<div class="kg-kb-msg__body">
							<div class="kg-kb-msg__bubble">{{ msg.content }}</div>
							<div v-if="index === 0 && msg.role === 'assistant'" class="kg-kb-quick">
								<div
									v-for="action in quickActions"
									:key="action.id"
									class="kg-kb-quick__item"
									@click="handleSend(action.prompt)"
								>
									<div class="kg-kb-quick__icon" :class="`is-${action.iconTone}`">
										<el-icon><Search v-if="action.iconTone === 'blue'" /><TrendCharts v-else-if="action.iconTone === 'emerald'" /><Document v-else-if="action.iconTone === 'amber'" /><Warning v-else /></el-icon>
									</div>
									<div>
										<div class="kg-kb-quick__title">{{ action.title }}</div>
										<div class="kg-kb-quick__preview">{{ action.preview }}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div v-if="isSending" class="kg-kb-msg kg-kb-msg--assistant">
						<div class="kg-kb-msg__avatar"><el-icon><Service /></el-icon></div>
						<div class="kg-kb-msg__bubble kg-kb-msg__typing">
							<span class="kg-kb-dot" /><span class="kg-kb-dot" /><span class="kg-kb-dot" />
							{{ t('message.pages.qualityLayout.kbAssistant.thinking') }}
						</div>
					</div>
				</div>

				<footer class="kg-kb-panel__foot">
					<div v-if="references.length" class="kg-kb-refs">
						<el-tag v-for="ref in references" :key="ref.id" size="small" closable @close="removeRef(ref.id)">
							{{ ref.name }}
						</el-tag>
					</div>
					<div class="kg-kb-input-row">
						<el-popover v-model:visible="attachOpen" placement="top-start" :width="200" trigger="click">
							<template #reference>
								<el-button class="kg-kb-input__plus" :class="{ 'is-active': attachOpen }" circle>
									<el-icon><Plus /></el-icon>
								</el-button>
							</template>
							<div v-if="!selectingProject" class="kg-kb-attach-menu">
								<div class="kg-kb-attach-menu__title">{{ t('message.pages.qualityLayout.kbAssistant.attachTitle') }}</div>
								<button type="button" @click="addRef('knowledge', '全局知识库')">
									<el-icon><Reading /></el-icon>{{ t('message.pages.qualityLayout.kbAssistant.attachKnowledge') }}
								</button>
								<button type="button" class="kg-kb-attach-menu__row" @click="selectingProject = true">
									<span><el-icon><Folder /></el-icon>{{ t('message.pages.qualityLayout.kbAssistant.attachProject') }}</span>
									<el-icon><ArrowRight /></el-icon>
								</button>
								<button type="button" @click="addRef('skill', '数据分析引擎')">
									<el-icon><Setting /></el-icon>{{ t('message.pages.qualityLayout.kbAssistant.attachSkill') }}
								</button>
							</div>
							<div v-else class="kg-kb-attach-menu">
								<button type="button" class="kg-kb-attach-menu__back" @click="selectingProject = false">
									<el-icon><ArrowLeft /></el-icon>{{ t('message.pages.qualityLayout.kbAssistant.attachBack') }}
								</button>
								<button v-for="p in projectOptions" :key="p" type="button" @click="addRef('project', p)">
									<el-icon><Folder /></el-icon>{{ p }}
								</button>
							</div>
						</el-popover>

						<div class="kg-kb-input-wrap">
							<input
								v-model="input"
								class="kg-kb-input"
								:placeholder="t('message.pages.qualityLayout.kbAssistant.inputPlaceholder')"
								:disabled="isSending"
								@keydown.enter="handleSend()"
							/>
							<el-button link class="kg-kb-input__spark" @click="onAiSuggest">
								<el-icon><MagicStick /></el-icon>
							</el-button>
							<button type="button" class="kg-kb-input__send" :disabled="isSending || !input.trim()" @click="handleSend()">
								<el-icon><Promotion /></el-icon>
							</button>
						</div>
					</div>
				</footer>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts" name="kgQueenAssistant">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowLeft,
	ArrowRight,
	Close,
	Coin,
	Document,
	Folder,
	Lightning,
	MagicStick,
	Plus,
	Promotion,
	Reading,
	Search,
	Service,
	Setting,
	TrendCharts,
	User,
	Warning,
} from '@element-plus/icons-vue';
import type { ChatMessage } from './mock';
import { projectOptions, quickActions, welcomeMessage } from './mock';

const { t } = useI18n();

const isOpen = ref(false);
const context = ref<'global' | 'issue'>('global');
const input = ref('');
const isSending = ref(false);
const attachOpen = ref(false);
const selectingProject = ref(false);
const tokenUsed = ref(0);
const tokenLimit = 500000;
const messagesRef = ref<HTMLElement | null>(null);

const references = ref<{ id: string; type: string; name: string }[]>([]);

const messages = ref<ChatMessage[]>([{ id: 'welcome', role: 'assistant', content: welcomeMessage }]);

function toggleOpen() {
	isOpen.value = !isOpen.value;
}

function scrollToBottom() {
	nextTick(() => {
		if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
	});
}

watch([messages, isOpen], scrollToBottom, { deep: true });

function addRef(type: string, name: string) {
	if (!references.value.find((r) => r.name === name)) {
		references.value.push({ id: String(Date.now()), type, name });
	}
	attachOpen.value = false;
	selectingProject.value = false;
}

function removeRef(id: string) {
	references.value = references.value.filter((r) => r.id !== id);
}

function onConfigSkills() {
	ElMessage.info(t('message.pages.qualityLayout.kbAssistant.configSkillsToast'));
}

function onAiSuggest() {
	ElMessage.info(t('message.pages.qualityLayout.kbAssistant.aiSuggestToast'));
}

async function handleSend(text?: string) {
	const content = (text ?? input.value).trim();
	if (!content || isSending.value) return;

	messages.value.push({ id: String(Date.now()), role: 'user', content });
	input.value = '';
	isSending.value = true;

	try {
		// Mock：与 React 一致结构，后续对接 /api/chat
		await new Promise((r) => setTimeout(r, 900));
		const reply = t('message.pages.qualityLayout.kbAssistant.mockReply');
		messages.value.push({ id: String(Date.now() + 1), role: 'assistant', content: reply });
		tokenUsed.value += Math.min(1200, content.length * 8);
	} catch {
		ElMessage.error(t('message.pages.qualityLayout.kbAssistant.sendFailed'));
		messages.value.push({
			id: String(Date.now() + 1),
			role: 'assistant',
			content: t('message.pages.qualityLayout.kbAssistant.networkError'),
		});
	} finally {
		isSending.value = false;
	}
}
</script>

<style scoped lang="scss">
.kg-kb-fab-wrap {
	position: fixed;
	right: 24px;
	bottom: 24px;
	z-index: 2000;
	display: flex;
	align-items: center;
}

.kg-kb-fab {
	width: 56px;
	height: 56px;
	border: none;
	border-radius: 4px;
	background: var(--el-color-primary);
	color: #fff;
	cursor: grab;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 10px 15px rgba(0, 0, 0, 0.12);
	transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
	&:hover {
		transform: scale(1.05);
		box-shadow: 0 12px 20px rgba(0, 0, 0, 0.18);
		filter: brightness(1.05);
	}
	&:active {
		cursor: grabbing;
		transform: scale(0.98);
	}
}

.kg-kb-fab__icon {
	width: 26px;
	height: 26px;
}

.kg-kb-fab__tooltip {
	position: absolute;
	right: calc(100% + 12px);
	top: 50%;
	transform: translateY(-50%);
	padding: 6px 12px;
	background: #1e293b;
	color: #fff;
	font-size: 12px;
	white-space: nowrap;
	border-radius: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.2s;
}

.kg-kb-fab-wrap:hover .kg-kb-fab__tooltip {
	opacity: 1;
}

.kg-kb-panel-enter-active,
.kg-kb-panel-leave-active {
	transition: opacity 0.2s, transform 0.2s;
}
.kg-kb-panel-enter-from,
.kg-kb-panel-leave-to {
	opacity: 0;
	transform: translateY(16px) scale(0.96);
}

.kg-kb-panel {
	position: fixed;
	right: 24px;
	bottom: 96px;
	z-index: 2001;
	width: 450px;
	max-width: calc(100vw - 48px);
	height: 650px;
	max-height: calc(100vh - 120px);
	background: #fff;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 4px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.kg-kb-panel__drag {
	height: 6px;
	background: var(--el-color-primary);
	flex-shrink: 0;
	cursor: grab;
}

.kg-kb-panel__head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 16px 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
}

.kg-kb-panel__brand {
	display: flex;
	gap: 12px;
	align-items: center;
}

.kg-kb-panel__logo {
	width: 36px;
	height: 36px;
	background: var(--el-color-primary);
	color: #fff;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	svg {
		width: 20px;
		height: 20px;
	}
}

.kg-kb-panel__title {
	font-size: 15px;
	font-weight: 700;
	color: var(--el-color-primary);
}

.kg-kb-panel__status {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 10px;
	color: var(--el-text-color-secondary);
	margin-top: 2px;
}

.kg-kb-panel__dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #10b981;
	box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
	animation: kg-kb-ping 1.5s ease infinite;
}

@keyframes kg-kb-ping {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.kg-kb-panel__head-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-kb-panel__quota {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 10px;
	color: var(--el-text-color-secondary);
	padding: 4px 8px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 6px;
	background: rgba(0, 0, 0, 0.02);
	.el-icon {
		color: #f59e0b;
	}
}

.kg-kb-panel__toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	flex-shrink: 0;
}

.kg-kb-panel__context {
	display: flex;
	gap: 8px;
}

.kg-kb-ctx {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	height: 24px;
	padding: 0 10px;
	font-size: 10px;
	border: 1px solid var(--el-border-color);
	border-radius: 4px;
	background: #fff;
	color: var(--el-text-color-regular);
	cursor: pointer;
	&.is-active {
		background: var(--el-color-primary);
		border-color: var(--el-color-primary);
		color: #fff;
	}
}

.kg-kb-panel__chat {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
	background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.kg-kb-msg {
	display: flex;
	gap: 12px;
	margin-bottom: 20px;
	&--user {
		flex-direction: row-reverse;
		.kg-kb-msg__bubble {
			background: var(--el-color-primary);
			color: #fff;
			border-radius: 12px 12px 2px 12px;
		}
		.kg-kb-msg__avatar {
			background: var(--el-color-primary);
			color: #fff;
		}
	}
}

.kg-kb-msg__avatar {
	width: 32px;
	height: 32px;
	border-radius: 4px;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
	border: 1px solid var(--el-color-primary-light-7);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.kg-kb-msg__body {
	flex: 1;
	min-width: 0;
	max-width: 85%;
}

.kg-kb-msg--user .kg-kb-msg__body {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.kg-kb-msg__bubble {
	font-size: 12px;
	line-height: 1.65;
	padding: 12px 14px;
	background: #fff;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 12px 12px 12px 2px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kg-kb-msg__typing {
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-kb-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--el-color-primary);
	opacity: 0.5;
	animation: kg-kb-bounce 0.9s infinite;
	&:nth-child(2) {
		animation-delay: 0.15s;
	}
	&:nth-child(3) {
		animation-delay: 0.3s;
	}
}

@keyframes kg-kb-bounce {
	0%,
	80%,
	100% {
		transform: translateY(0);
	}
	40% {
		transform: translateY(-4px);
	}
}

.kg-kb-quick {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 12px;
}

.kg-kb-quick__item {
	display: flex;
	gap: 10px;
	padding: 8px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 8px;
	cursor: pointer;
	transition: border-color 0.15s, background 0.15s;
	&:hover {
		border-color: var(--el-color-primary-light-5);
		background: var(--el-color-primary-light-9);
	}
}

.kg-kb-quick__icon {
	width: 32px;
	height: 32px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	&.is-blue {
		background: #dbeafe;
		color: #2563eb;
	}
	&.is-emerald {
		background: #d1fae5;
		color: #059669;
	}
	&.is-amber {
		background: #fef3c7;
		color: #d97706;
	}
	&.is-purple {
		background: #ede9fe;
		color: #7c3aed;
	}
}

.kg-kb-quick__title {
	font-size: 11px;
	font-weight: 600;
}

.kg-kb-quick__preview {
	font-size: 9px;
	color: var(--el-text-color-secondary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 280px;
}

.kg-kb-panel__foot {
	border-top: 1px solid var(--el-border-color-lighter);
	padding: 12px;
	background: rgba(255, 255, 255, 0.95);
	flex-shrink: 0;
}

.kg-kb-refs {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 8px;
}

.kg-kb-input-row {
	display: flex;
	align-items: center;
	gap: 4px;
}

.kg-kb-input-wrap {
	flex: 1;
	position: relative;
	display: flex;
	align-items: center;
}

.kg-kb-input {
	flex: 1;
	height: 44px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 12px;
	padding: 0 88px 0 14px;
	font-size: 12px;
	background: #f1f5f9;
	outline: none;
	&:focus {
		border-color: var(--el-color-primary);
		background: #fff;
	}
}

.kg-kb-input__spark {
	position: absolute;
	right: 44px;
}

.kg-kb-input__send {
	position: absolute;
	right: 4px;
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 8px;
	background: linear-gradient(135deg, #4f46e5, #9333ea);
	color: #fff;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.kg-kb-attach-menu {
	display: flex;
	flex-direction: column;
	gap: 2px;
	button {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		border: none;
		background: none;
		font-size: 12px;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		&:hover {
			background: var(--el-fill-color-light);
		}
	}
}

.kg-kb-attach-menu__title {
	font-size: 10px;
	font-weight: 600;
	color: var(--el-text-color-secondary);
	padding: 6px 10px;
	text-transform: uppercase;
}

.kg-kb-attach-menu__row {
	justify-content: space-between !important;
}

.kg-kb-attach-menu__back {
	color: var(--el-text-color-secondary);
}
</style>
