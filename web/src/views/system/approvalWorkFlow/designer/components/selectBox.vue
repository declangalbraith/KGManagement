<template>
	<ul class="select-box">
		<template v-for="(elem, i) in list" :key="i">
			<template v-if="elem.type === 'role'">
				<li
					v-for="item in elem.data"
					:key="item.roleId"
					class="check_box"
					:class="{ active: elem.isActive && elem.isActive(item), not: elem.not }"
					@click="elem.change(item)"
				>
					<a :title="item.description" :class="{ active: elem.isActiveItem && elem.isActiveItem(item) }">
						<el-icon class="kg-wf-select-icon"><UserFilled /></el-icon>{{ item.roleName }}
					</a>
				</li>
			</template>
			<template v-if="elem.type === 'department'">
				<li v-for="item in elem.data" :key="item.id" class="check_box" :class="{ not: !elem.isDepartment }">
					<a v-if="elem.isDepartment" :class="elem.isActive(item) && 'active'" @click="elem.change(item)">
						<el-icon class="kg-wf-select-icon"><Folder /></el-icon>{{ item.departmentName }}
					</a>
					<a v-else><el-icon class="kg-wf-select-icon"><Folder /></el-icon>{{ item.departmentName }}</a>
					<i @click="elem.next(item)">下级</i>
				</li>
			</template>
			<template v-if="elem.type === 'employee'">
				<li v-for="item in elem.data" :key="item.id" class="check_box">
					<a
						:class="elem.isActive(item) && 'active'"
						@click="elem.change(item)"
						:title="item.departmentNames"
					>
						<el-icon class="kg-wf-select-icon"><User /></el-icon>{{ item.employeeName }}
					</a>
				</li>
			</template>
		</template>
	</ul>
</template>

<script setup>
import { Folder, User, UserFilled } from '@element-plus/icons-vue';

defineProps({
	list: {
		type: Array,
		default: () => [],
	},
});
</script>

<style lang="less">
.select-box {
	height: 420px;
	overflow-y: auto;

	li {
		padding: 5px 0;

		i {
			float: right;
			padding-left: 12px;
			padding-right: 10px;
			color: #3195f8;
			font-size: 12px;
			cursor: pointer;
			border-left: 1px solid rgb(238, 238, 238);
		}

		a.active + i {
			color: rgb(197, 197, 197);
			pointer-events: none;
		}
	}

	.kg-wf-select-icon {
		vertical-align: middle;
		margin-right: 5px;
		font-size: 14px;
	}
}
</style>
