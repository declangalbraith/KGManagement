<template>
	<Teleport to="body">
		<Transition name="kg-8d-slide">
			<aside v-if="visible" class="kg-8d-panel" role="dialog" aria-labelledby="kg-8d-title">
				<header class="kg-8d-panel__head">
					<div class="kg-8d-panel__head-left">
						<div class="kg-8d-panel__icon">
							<el-icon><Document /></el-icon>
						</div>
						<div>
							<h2 id="kg-8d-title" class="kg-8d-panel__title">{{ t('message.pages.issues.dynamic8dDraft') }}</h2>
							<div class="kg-8d-panel__status-line">
								<el-icon class="is-purple"><MagicStick /></el-icon>
								<span class="is-purple">{{ t('message.pages.issues.queenShadowWriting') }}</span>
								<span>{{ t('message.pages.issues.lastUpdated', { time: t('message.pages.issues.justNow') }) }}</span>
							</div>
						</div>
					</div>
					<button type="button" class="kg-8d-close" aria-label="close" @click="close">
						<el-icon><Close /></el-icon>
					</button>
				</header>

				<div class="kg-8d-panel__body">
					<!-- D1 -->
					<section class="kg-8d-sec">
						<div class="kg-8d-sec__head">
							<h3>{{ t('message.pages.issues.d8d1Title') }}</h3>
							<span class="kg-8d-badge kg-8d-badge--done">{{ t('message.pages.issues.statusDone') }}</span>
						</div>
						<div class="kg-8d-box kg-8d-box--muted">
							<p><strong>{{ t('message.pages.issues.champion') }}:</strong> 李四</p>
							<p><strong>{{ t('message.pages.issues.members') }}:</strong> 张三 (质量), 王五 (生产), 赵六 (工程)</p>
						</div>
					</section>

					<!-- D2 -->
					<section class="kg-8d-sec">
						<div class="kg-8d-sec__head">
							<h3>{{ t('message.pages.issues.d8d2Title') }}</h3>
							<span class="kg-8d-badge kg-8d-badge--done">{{ t('message.pages.issues.statusDone') }}</span>
						</div>
						<div class="kg-8d-box kg-8d-box--queen">
							<span class="kg-8d-queen-tag">
								<el-icon><MagicStick /></el-icon>
								{{ t('message.pages.issues.queenExtracted') }}
							</span>
							<p>
								2026年4月10日，在总装车间发现批次为 BATCH-202604-001 的列车闸瓦在常规制动测试中出现异常磨损。磨损率超出标准公差 15%。
							</p>
						</div>
					</section>

					<!-- D3 -->
					<section class="kg-8d-sec">
						<div class="kg-8d-sec__head">
							<h3>{{ t('message.pages.issues.d8d3Title') }}</h3>
							<span class="kg-8d-badge kg-8d-badge--done">{{ t('message.pages.issues.statusDone') }}</span>
						</div>
						<div class="kg-8d-box kg-8d-box--queen">
							<span class="kg-8d-queen-tag">
								<el-icon><MagicStick /></el-icon>
								{{ t('message.pages.issues.queenExtracted') }}
							</span>
							<ul>
								<li>立即隔离 BATCH-202604-001 批次的所有剩余库存。</li>
								<li>暂停使用该供应商的当前批次物料，切换至备用供应商物料。</li>
								<li>对已安装该批次闸瓦的 5 列车进行紧急召回和更换。</li>
							</ul>
						</div>
					</section>

					<!-- D4 -->
					<section class="kg-8d-sec">
						<div class="kg-8d-sec__head">
							<h3 class="kg-8d-sec__title-live">
								{{ t('message.pages.issues.d8d4Title') }}
								<span v-if="!isEditingD4" class="kg-8d-pulse" aria-hidden="true" />
							</h3>
							<div class="kg-8d-sec__actions">
								<span class="kg-8d-badge kg-8d-badge--writing">{{ t('message.pages.issues.writing') }}</span>
								<button
									v-if="isEditingD4"
									type="button"
									class="kg-8d-inline-btn is-primary"
									@click="isEditingD4 = false"
								>
									<el-icon><Check /></el-icon>
									{{ t('message.pages.issues.save') }}
								</button>
								<button v-else type="button" class="kg-8d-inline-btn" @click="isEditingD4 = true">
									<el-icon><EditPen /></el-icon>
									{{ t('message.pages.issues.manualEdit') }}
								</button>
							</div>
						</div>
						<div class="kg-8d-box kg-8d-box--live">
							<div class="kg-8d-box__accent" />
							<span v-if="!isEditingD4" class="kg-8d-queen-tag kg-8d-queen-tag--sync">
								<el-icon class="is-pulse"><MagicStick /></el-icon>
								{{ t('message.pages.issues.queenLiveSync') }}
							</span>
							<div v-if="isEditingD4" class="kg-8d-edit">
								<el-input v-model="d4Content" type="textarea" :rows="8" resize="none" />
							</div>
							<template v-else>
								<p class="kg-8d-intro">
									<el-icon><MagicStick /></el-icon>
									基于故事线中的鱼骨图分析，初步结论如下：
								</p>
								<div class="kg-8d-rca">
									<div class="kg-8d-rca__row">
										<span class="kg-8d-rca__tag">物料</span>
										<span>同批次闸瓦材质过硬，硬度测试报告显示超出标准上限。</span>
									</div>
									<div class="kg-8d-rca__row">
										<span class="kg-8d-rca__tag">人员</span>
										<span>操作员在接收物料时未严格执行硬度抽检。</span>
									</div>
									<div class="kg-8d-rca__row is-pending">
										<span class="kg-8d-rca__tag is-dashed">方法</span>
										<span>正在分析工艺参数设置记录...</span>
									</div>
								</div>
							</template>
						</div>
					</section>

					<!-- D5 placeholder -->
					<section class="kg-8d-sec is-dimmed">
						<div class="kg-8d-sec__head">
							<h3>{{ t('message.pages.issues.d8d5Title') }}</h3>
							<span class="kg-8d-badge kg-8d-badge--pending">{{ t('message.pages.issues.statusPending') }}</span>
						</div>
						<div class="kg-8d-box kg-8d-box--placeholder">
							{{ t('message.pages.issues.waitStoryline') }}
						</div>
					</section>
				</div>

				<footer class="kg-8d-panel__foot">
					<button type="button" class="kg-8d-foot-btn is-outline" @click="onExport">
						{{ t('message.pages.issues.exportPdf') }}
					</button>
					<button type="button" class="kg-8d-foot-btn is-primary" @click="onSubmit">
						<el-icon><CircleCheck /></el-icon>
						{{ t('message.pages.issues.submitReview') }}
					</button>
				</footer>
			</aside>
		</Transition>
		<Transition name="kg-8d-fade">
			<div v-if="visible" class="kg-8d-backdrop" @click="close" />
		</Transition>
	</Teleport>
</template>

<script setup lang="ts" name="Dynamic8DReport">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Check, CircleCheck, Close, Document, EditPen, MagicStick } from '@element-plus/icons-vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
const { t } = useI18n();

const visible = computed({
	get: () => props.modelValue,
	set: (v) => emit('update:modelValue', v),
});

const isEditingD4 = ref(false);
const d4Content = ref(`基于故事线中的鱼骨图分析，初步结论如下：
- 物料：同批次闸瓦材质过硬，硬度测试报告显示超出标准上限。
- 人员：操作员在接收物料时未严格执行硬度抽检。
- 方法：正在分析工艺参数设置记录...`);

function close() {
	visible.value = false;
}

function onExport() {
	ElMessage.success(t('message.pages.issues.exportPdfSuccess'));
}

function onSubmit() {
	ElMessage.success(t('message.pages.issues.submitReviewSuccess'));
	close();
}
</script>

<style scoped lang="scss">
.kg-8d-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.25);
	z-index: 89;
}

.kg-8d-panel {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	width: 600px;
	max-width: 100vw;
	z-index: 90;
	display: flex;
	flex-direction: column;
	background: #fff;
	border-left: 1px solid rgba(0, 0, 0, 0.08);
	box-shadow: -8px 0 32px rgba(0, 0, 0, 0.08);
}

.kg-8d-panel__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	flex-shrink: 0;
}

.kg-8d-panel__head-left {
	display: flex;
	gap: 12px;
	align-items: flex-start;
}

.kg-8d-panel__icon {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
}

.kg-8d-panel__title {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #0f172a;
}

.kg-8d-panel__status-line {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 4px;
	font-size: 12px;
	color: #64748b;
	.is-purple {
		color: #7c3aed;
		font-weight: 500;
	}
}

.kg-8d-close {
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
		background: #f1f5f9;
		color: #0f172a;
	}
}

.kg-8d-panel__body {
	flex: 1;
	overflow-y: auto;
	padding: 24px;
}

.kg-8d-panel__foot {
	flex-shrink: 0;
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	background: #fff;
}

.kg-8d-sec {
	margin-bottom: 32px;
	&.is-dimmed {
		opacity: 0.55;
	}
}

.kg-8d-sec__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	margin-bottom: 12px;
	h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
	}
}

.kg-8d-sec__title-live {
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-8d-pulse {
	position: relative;
	width: 8px;
	height: 8px;
	&::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: #a78bfa;
		animation: kg-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
	&::after {
		content: '';
		position: relative;
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #7c3aed;
	}
}

@keyframes kg-ping {
	75%,
	100% {
		transform: scale(2);
		opacity: 0;
	}
}

.kg-8d-sec__actions {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

.kg-8d-badge {
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 4px;
	font-weight: 600;
	white-space: nowrap;
	&--done {
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
	}
	&--writing {
		background: #fff7ed;
		color: #c2410c;
		border: 1px solid #fed7aa;
	}
	&--pending {
		background: #f1f5f9;
		color: #64748b;
		border: 1px solid #e2e8f0;
	}
}

.kg-8d-inline-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border: none;
	background: transparent;
	font-size: 12px;
	color: #64748b;
	cursor: pointer;
	padding: 2px 6px;
	border-radius: 4px;
	&:hover {
		color: var(--el-color-primary);
		background: rgba(64, 158, 255, 0.06);
	}
	&.is-primary {
		color: var(--el-color-primary);
	}
}

.kg-8d-box {
	position: relative;
	border-radius: 8px;
	padding: 14px 16px;
	font-size: 13px;
	line-height: 1.65;
	color: #334155;
	p {
		margin: 0 0 8px;
		&:last-child {
			margin-bottom: 0;
		}
	}
	ul {
		margin: 0;
		padding-left: 1.25em;
		li + li {
			margin-top: 6px;
		}
	}
	&--muted {
		background: rgba(0, 0, 0, 0.03);
	}
	&--queen {
		background: #faf5ff;
		border: 1px solid #e9d5ff;
		padding-top: 18px;
	}
	&--live {
		background: linear-gradient(135deg, rgba(243, 232, 255, 0.8), rgba(224, 231, 255, 0.6));
		border: 1px solid #c4b5fd;
		border-radius: 12px;
		padding: 18px 16px 16px 20px;
		box-shadow: 0 1px 3px rgba(124, 58, 237, 0.08);
		overflow: hidden;
	}
	&--placeholder {
		background: rgba(0, 0, 0, 0.03);
		min-height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #94a3b8;
		font-style: italic;
	}
}

.kg-8d-box__accent {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 4px;
	background: linear-gradient(180deg, #7c3aed, #4f46e5);
	border-radius: 12px 0 0 12px;
}

.kg-8d-queen-tag {
	position: absolute;
	top: -8px;
	right: -4px;
	display: inline-flex;
	align-items: center;
	gap: 3px;
	font-size: 9px;
	padding: 2px 6px;
	border-radius: 4px;
	background: #7c3aed;
	color: #fff;
	box-shadow: 0 1px 3px rgba(124, 58, 237, 0.35);
	z-index: 1;
	&--sync {
		font-size: 10px;
		padding: 4px 8px;
		border-radius: 6px;
		background: linear-gradient(90deg, #7c3aed, #4f46e5);
	}
	.is-pulse {
		animation: kg-pulse-icon 2s ease-in-out infinite;
	}
}

@keyframes kg-pulse-icon {
	50% {
		opacity: 0.5;
	}
}

.kg-8d-intro {
	display: flex;
	align-items: flex-start;
	gap: 6px;
	font-style: italic;
	color: #64748b;
	margin: 4px 0 12px !important;
}

.kg-8d-rca {
	border-left: 2px solid #ddd6fe;
	padding-left: 10px;
	margin-left: 4px;
}

.kg-8d-rca__row {
	display: flex;
	gap: 8px;
	align-items: flex-start;
	margin-bottom: 10px;
	&.is-pending {
		opacity: 0.75;
		animation: kg-text-pulse 2s ease-in-out infinite;
		span:last-child {
			color: #94a3b8;
		}
	}
}

.kg-8d-rca__tag {
	flex-shrink: 0;
	font-size: 9px;
	padding: 2px 6px;
	border-radius: 4px;
	border: 1px solid #e2e8f0;
	background: #fff;
	font-weight: 600;
	&.is-dashed {
		border-style: dashed;
	}
}

@keyframes kg-text-pulse {
	50% {
		opacity: 0.5;
	}
}

.kg-8d-edit :deep(.el-textarea__inner) {
	border-color: #c4b5fd;
	font-size: 13px;
	&:focus {
		border-color: #7c3aed;
		box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.2);
	}
}

.kg-8d-foot-btn {
	height: 36px;
	padding: 0 16px;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	&.is-outline {
		border: 1px solid #e2e8f0;
		background: #fff;
		color: #334155;
		&:hover {
			background: #f8fafc;
		}
	}
	&.is-primary {
		border: none;
		background: #1a1a1a;
		color: #fff;
		&:hover {
			background: #333;
		}
	}
}

.kg-8d-slide-enter-active,
.kg-8d-slide-leave-active {
	transition: transform 0.25s ease, opacity 0.25s ease;
}
.kg-8d-slide-enter-from,
.kg-8d-slide-leave-to {
	transform: translateX(100%);
	opacity: 0;
}

.kg-8d-fade-enter-active,
.kg-8d-fade-leave-active {
	transition: opacity 0.2s ease;
}
.kg-8d-fade-enter-from,
.kg-8d-fade-leave-to {
	opacity: 0;
}
</style>
