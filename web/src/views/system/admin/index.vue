<template>
	<div class="kg-admin">
		<div class="kg-admin__head">
			<h1>{{ t('message.pages.admin.title') }}</h1>
			<p>{{ t('message.pages.admin.subtitle') }}</p>
		</div>
		<el-row :gutter="16">
			<el-col v-for="mod in adminModules" :key="mod.key" :xs="24" :sm="12" :lg="8">
				<el-card shadow="hover" class="kg-admin__card" @click="enter(mod)">
					<div class="kg-admin__card-title">
						<el-icon :size="22"><component :is="iconMap[mod.icon]" /></el-icon>
						<span>{{ mod.title }}</span>
					</div>
					<p>{{ mod.desc }}</p>
					<el-button link type="primary" :loading="loading[mod.key]">{{ t('message.pages.admin.enter') }}</el-button>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="kg-admin-index">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Collection, Key, Menu, OfficeBuilding, Setting, User } from '@element-plus/icons-vue';
import { adminModules } from './mock';

const { t } = useI18n();
const router = useRouter();
const loading = reactive<Record<string, boolean>>({});

const iconMap: Record<string, object> = {
	User,
	Key,
	OfficeBuilding,
	Menu,
	Collection,
	Setting,
};

function enter(mod: (typeof adminModules)[0]) {
	loading[mod.key] = true;
	setTimeout(() => {
		loading[mod.key] = false;
		ElMessage.info(t('message.pages.admin.loading', { name: mod.title }));
		router.push(mod.route).catch(() => {
			ElMessage.warning(`平台路由 ${mod.route} 需在后端菜单中配置后访问`);
		});
	}, 400);
}
</script>

<style scoped lang="scss">
.kg-admin__head {
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
.kg-admin__card {
	margin-bottom: 16px;
	cursor: pointer;
	p {
		font-size: 13px;
		color: var(--el-text-color-secondary);
		min-height: 40px;
	}
}
.kg-admin__card-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	margin-bottom: 8px;
}
</style>
