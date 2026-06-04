<template>
	<Teleport to="body">
		<Transition name="kg-viewer-fade">
			<div v-if="modelValue" class="kg-viewer-overlay" @click.self="close">
				<div class="kg-viewer">
					<header class="kg-viewer__head">
						<div class="kg-viewer__head-left">
							<div class="kg-viewer__icon">
								<el-icon><WarningFilled /></el-icon>
							</div>
							<div>
								<h2>{{ title }}</h2>
								<p>
									<span class="kg-viewer__type">{{ typeLabel }} Document</span>
									<span>·</span>
									<span class="kg-viewer__controlled">{{ t('message.pages.generalDoc.controlledDoc') }}</span>
								</p>
							</div>
						</div>
						<div class="kg-viewer__head-actions">
							<button type="button" class="kg-viewer__btn" @click="onPrint">
								<el-icon><Printer /></el-icon>
								{{ t('message.pages.generalDoc.print') }}
							</button>
							<button type="button" class="kg-viewer__btn" @click="emit('download')">
								<el-icon><Download /></el-icon>
								{{ t('message.pages.generalDoc.download') }}
							</button>
							<button type="button" class="kg-viewer__close" @click="close">
								<el-icon><Close /></el-icon>
							</button>
						</div>
					</header>

					<div class="kg-viewer__body">
						<div class="kg-viewer__watermark" aria-hidden="true">
							<span v-for="i in 20" :key="i">{{ watermarkText }}</span>
						</div>
						<div class="kg-viewer__paper">
							<slot>
								<div class="kg-viewer__placeholder">
									<h1>{{ title }}</h1>
									<div class="kg-line w-full" />
									<div class="kg-line w-5-6" />
									<div class="kg-line w-4-6" />
									<div class="kg-spacer" />
									<div class="kg-line w-full" />
									<div class="kg-line w-full" />
									<div class="kg-line w-3-4" />
									<div class="kg-spacer" />
									<div class="kg-blocks">
										<div class="kg-block" />
										<div class="kg-block" />
									</div>
									<div class="kg-spacer" />
									<div class="kg-line w-full" />
									<div class="kg-line w-5-6" />
								</div>
							</slot>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts" name="DocumentViewer">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Close, Download, Printer, WarningFilled } from '@element-plus/icons-vue';

const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		title: string;
		watermarkText?: string;
		docType?: 'pdf' | 'word' | 'excel' | 'text' | 'markdown';
	}>(),
	{
		watermarkText: 'CONFIDENTIAL - DO NOT DISTRIBUTE',
		docType: 'pdf',
	}
);

const emit = defineEmits<{ 'update:modelValue': [boolean]; download: [] }>();
const { t } = useI18n();

const typeLabel = computed(() => props.docType.toUpperCase());

function close() {
	emit('update:modelValue', false);
}

function onPrint() {
	ElMessage.info(t('message.pages.generalDoc.printToast'));
}

watch(
	() => props.modelValue,
	(open) => {
		document.body.style.overflow = open ? 'hidden' : '';
	}
);
</script>

<style scoped lang="scss">
.kg-viewer-overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(4px);
	padding: 16px;
}

.kg-viewer {
	width: 100%;
	max-width: 1024px;
	height: 90vh;
	background: #fff;
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.kg-viewer__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 24px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	background: rgba(0, 0, 0, 0.02);
	flex-shrink: 0;
	gap: 12px;
}

.kg-viewer__head-left {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.kg-viewer__icon {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background: rgba(59, 130, 246, 0.1);
	color: var(--el-color-primary);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	flex-shrink: 0;
}

.kg-viewer__head-left h2 {
	margin: 0;
	font-size: 17px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kg-viewer__head-left p {
	margin: 4px 0 0;
	font-size: 11px;
	color: #64748b;
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
}

.kg-viewer__type {
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.kg-viewer__controlled {
	color: #dc2626;
	font-weight: 600;
}

.kg-viewer__head-actions {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

.kg-viewer__btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 32px;
	padding: 0 12px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 13px;
	color: #334155;
	cursor: pointer;
	@media (max-width: 640px) {
		span {
			display: none;
		}
	}
	&:hover {
		background: #f8fafc;
	}
}

.kg-viewer__close {
	width: 36px;
	height: 36px;
	border: none;
	background: transparent;
	border-radius: 50%;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	&:hover {
		background: #fef2f2;
		color: #dc2626;
	}
}

.kg-viewer__body {
	position: relative;
	flex: 1;
	overflow: auto;
	background: #f1f5f9;
	padding: 32px 48px;
}

.kg-viewer__watermark {
	pointer-events: none;
	position: absolute;
	inset: 0;
	overflow: hidden;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 48px;
	opacity: 0.06;
	z-index: 1;
	user-select: none;
	span {
		font-size: 28px;
		font-weight: 700;
		white-space: nowrap;
		transform: rotate(-45deg);
		color: #0f172a;
	}
}

.kg-viewer__paper {
	position: relative;
	z-index: 2;
	max-width: 768px;
	margin: 0 auto;
	min-height: 100%;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 2px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	padding: 48px 64px;

	&:has(.kg-viewer__pdf-frame) {
		max-width: none;
		padding: 0;
		min-height: auto;
	}
}

:deep(.kg-viewer__pdf-frame) {
	display: block;
	width: 100%;
	min-height: calc(90vh - 120px);
	border: none;
}

:deep(.kg-viewer__html-content) {
	line-height: 1.75;
	color: #0f172a;
	font-size: 15px;
	word-break: break-word;

	p {
		margin: 0 0 1em;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1em 0;
		font-size: 14px;
	}
	td {
		border: 1px solid #e2e8f0;
		padding: 8px 10px;
		vertical-align: top;
	}
}

:deep(.kg-viewer__preview-state) {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 320px;
	gap: 12px;
	color: #64748b;
	font-size: 14px;
}

:deep(.kg-viewer__preview-state.is-error) {
	color: #dc2626;
}

.kg-viewer__placeholder {
	h1 {
		font-size: 28px;
		font-weight: 700;
		text-align: center;
		margin: 0 0 48px;
		color: #0f172a;
	}
}

.kg-line {
	height: 16px;
	background: #e2e8f0;
	border-radius: 4px;
	margin-bottom: 12px;
	&.w-full {
		width: 100%;
	}
	&.w-5-6 {
		width: 83.333%;
	}
	&.w-4-6 {
		width: 66.666%;
	}
	&.w-3-4 {
		width: 75%;
	}
}

.kg-spacer {
	height: 32px;
}

.kg-blocks {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
}

.kg-block {
	height: 128px;
	background: #e2e8f0;
	border-radius: 4px;
}

.kg-viewer-fade-enter-active,
.kg-viewer-fade-leave-active {
	transition: opacity 0.2s ease;
}
.kg-viewer-fade-enter-active .kg-viewer,
.kg-viewer-fade-leave-active .kg-viewer {
	transition: transform 0.2s ease, opacity 0.2s ease;
}
.kg-viewer-fade-enter-from,
.kg-viewer-fade-leave-to {
	opacity: 0;
}
.kg-viewer-fade-enter-from .kg-viewer,
.kg-viewer-fade-leave-to .kg-viewer {
	transform: scale(0.96);
	opacity: 0;
}
</style>
