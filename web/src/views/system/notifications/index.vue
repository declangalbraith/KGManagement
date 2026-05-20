<template>
	<div class="kg-notify">
		<div class="kg-notify__head">
			<div>
				<h1>{{ t('message.pages.notifications.title') }}</h1>
				<p>{{ t('message.pages.notifications.subtitle') }}</p>
			</div>
			<el-button :loading="marking" @click="markAllRead">{{ t('message.pages.notifications.markAllRead') }}</el-button>
		</div>
		<el-card shadow="never">
			<el-tabs v-model="tab">
				<el-tab-pane :label="t('message.pages.notifications.tabAll')" name="all" />
				<el-tab-pane :label="`${t('message.pages.notifications.tabUnread')} (${unreadCount})`" name="unread" />
				<el-tab-pane :label="t('message.pages.notifications.tabMention')" name="mention" />
				<el-tab-pane :label="t('message.pages.notifications.tabSystem')" name="system" />
			</el-tabs>
			<div class="kg-notify__list">
				<div
					v-for="n in filtered"
					:key="n.id"
					class="kg-notify__item"
					:class="{ 'is-unread': !n.read }"
					@click="onClick(n)"
				>
					<div class="kg-notify__dot" v-if="!n.read" />
					<div class="kg-notify__body">
						<div class="kg-notify__title-row">
							<strong>{{ n.title }}</strong>
							<span>{{ n.time }}</span>
						</div>
						<p>{{ n.content }}</p>
					</div>
				</div>
				<el-empty v-if="!filtered.length" />
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-notifications-index">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { notifications } from './mock';
import type { NotificationItem } from './mock';

const { t } = useI18n();
const tab = ref('all');
const list = ref([...notifications]);
const marking = ref(false);

const unreadCount = computed(() => list.value.filter((n) => !n.read).length);

const filtered = computed(() => {
	if (tab.value === 'unread') return list.value.filter((n) => !n.read);
	if (tab.value === 'mention') return list.value.filter((n) => n.title.includes('@'));
	if (tab.value === 'system') return list.value.filter((n) => n.type === 'system');
	return list.value;
});

function markAllRead() {
	marking.value = true;
	setTimeout(() => {
		list.value.forEach((n) => (n.read = true));
		marking.value = false;
		ElMessage.success(t('message.pages.notifications.markAllSuccess'));
	}, 500);
}

function onClick(n: NotificationItem) {
	n.read = true;
	ElMessage.info(t('message.pages.notifications.opening'));
}
</script>

<style scoped lang="scss">
.kg-notify__head {
	display: flex;
	justify-content: space-between;
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
.kg-notify__item {
	display: flex;
	gap: 12px;
	padding: 14px 16px;
	border-bottom: 1px solid var(--el-border-color-lighter);
	cursor: pointer;
	&:hover {
		background: var(--el-fill-color-light);
	}
	&.is-unread {
		background: var(--el-color-primary-light-9);
	}
}
.kg-notify__dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--el-color-primary);
	margin-top: 8px;
	flex-shrink: 0;
}
.kg-notify__title-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 4px;
	span {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}
}
.kg-notify__body p {
	margin: 0;
	font-size: 13px;
	color: var(--el-text-color-regular);
}
</style>
