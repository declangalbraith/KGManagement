<template>
	<el-drawer v-model="visible" :title="t('message.pages.issues.dynamic8d')" size="520px" destroy-on-close>
		<div class="kg-8d-drawer">
			<section v-for="sec in sections" :key="sec.id" class="kg-8d-drawer__sec">
				<div class="kg-8d-drawer__sec-head">
					<h3>{{ sec.title }}</h3>
					<el-tag :type="sec.done ? 'success' : 'info'" size="small">{{ sec.done ? '已完成' : '进行中' }}</el-tag>
				</div>
				<p class="kg-8d-drawer__body">{{ sec.content }}</p>
			</section>
		</div>
	</el-drawer>
</template>

<script setup lang="ts" name="Dynamic8DReport">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
const { t } = useI18n();

const visible = computed({
	get: () => props.modelValue,
	set: (v) => emit('update:modelValue', v),
});

const sections = [
	{ id: 'D1', title: 'D1: 成立团队', done: true, content: '负责人：李四；成员：张三、王五、赵六' },
	{ id: 'D2', title: 'D2: 描述问题', done: true, content: '闸瓦异常磨损，磨损率超出标准公差 15%。' },
	{ id: 'D4', title: 'D4: 根本原因', done: false, content: '物料硬度超标；入厂检验执行不到位（Queen 伴写草稿）' },
];
</script>

<style scoped lang="scss">
.kg-8d-drawer__sec {
	margin-bottom: 20px;
}
.kg-8d-drawer__sec-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--el-border-color-lighter);
	padding-bottom: 8px;
	margin-bottom: 8px;
	h3 {
		margin: 0;
		font-size: 14px;
	}
}
.kg-8d-drawer__body {
	font-size: 13px;
	color: var(--el-text-color-regular);
	line-height: 1.6;
	margin: 0;
}
</style>
