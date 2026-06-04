<template>
	<div class="select-result l">
		<p class="clear">
			已选（{{ total }}）
			<a @click="emits('del')">清空</a>
		</p>
		<ul>
			<template v-for="{ type, data, cancel } in list" :key="type">
				<template v-if="type === 'role'">
					<li v-for="item in data" :key="item.roleId">
						<el-icon class="kg-wf-select-icon"><UserFilled /></el-icon>
						<span>{{ item.roleName }}</span>
						<el-icon class="kg-wf-remove-icon" @click="cancel(item)"><Close /></el-icon>
					</li>
				</template>
				<template v-if="type === 'department'">
					<li v-for="item in data" :key="item.id">
						<el-icon class="kg-wf-select-icon"><Folder /></el-icon>
						<span>{{ item.departmentName }}</span>
						<el-icon class="kg-wf-remove-icon" @click="cancel(item)"><Close /></el-icon>
					</li>
				</template>
				<template v-if="type === 'employee'">
					<li v-for="item in data" :key="item.id">
						<el-icon class="kg-wf-select-icon"><User /></el-icon>
						<span>{{ item.employeeName }}</span>
						<el-icon class="kg-wf-remove-icon" @click="cancel(item)"><Close /></el-icon>
					</li>
				</template>
			</template>
		</ul>
	</div>
</template>

<script setup>
import { Close, Folder, User, UserFilled } from '@element-plus/icons-vue';

defineProps({
	total: {
		type: Number,
		default: 0,
	},
	list: {
		type: Array,
		default: () => [],
	},
});
const emits = defineEmits(['del']);
</script>

<style lang="less">
.select-result {
	width: 276px;
	height: 100%;
	font-size: 12px;

	ul {
		height: 460px;
		overflow-y: auto;

		li {
			margin: 11px 26px 13px 19px;
			line-height: 17px;
			display: flex;
			align-items: center;
			gap: 5px;

			span {
				flex: 1;
			}
		}
	}

	p {
		padding-left: 19px;
		padding-right: 20px;
		line-height: 37px;
		border-bottom: 1px solid #f2f2f2;

		a {
			float: right;
			cursor: pointer;
		}
	}

	.kg-wf-select-icon {
		font-size: 14px;
		flex-shrink: 0;
	}

	.kg-wf-remove-icon {
		font-size: 14px;
		cursor: pointer;
		color: #94a3b8;
		flex-shrink: 0;
	}
}
</style>
