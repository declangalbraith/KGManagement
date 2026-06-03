<template>
	<el-dialog v-model="visibleDialog" title="选择成员" width="560px" append-to-body class="promoter_person">
		<el-input v-model="searchVal" placeholder="搜索成员" clearable class="kg-wf-user-search" />
		<div v-loading="loading" class="kg-wf-user-list">
			<el-checkbox-group v-model="checkedIds">
				<label v-for="user in filteredUsers" :key="user.id" class="kg-wf-user-item">
					<el-checkbox :label="user.id">{{ user.name || user.username }}</el-checkbox>
				</label>
			</el-checkbox-group>
			<el-empty v-if="!loading && !filteredUsers.length" description="无匹配用户" :image-size="48" />
		</div>
		<template #footer>
			<el-button @click="closeDialog">取消</el-button>
			<el-button type="primary" @click="saveDialog">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { GetList } from '/@/views/system/user/api';

type NodeUser = { type: number; targetId: number; name: string };
type UserRow = { id: number; name?: string; username: string };

const props = defineProps<{
	visible: boolean;
	data: NodeUser[];
	isDepartment?: boolean;
}>();

const emit = defineEmits<{
	'update:visible': [value: boolean];
	change: [value: NodeUser[]];
}>();

const searchVal = ref('');
const loading = ref(false);
const users = ref<UserRow[]>([]);
const checkedIds = ref<number[]>([]);

const visibleDialog = computed({
	get: () => props.visible,
	set: () => closeDialog(),
});

const filteredUsers = computed(() => {
	const q = searchVal.value.trim().toLowerCase();
	if (!q) return users.value;
	return users.value.filter((u) => `${u.name || ''} ${u.username}`.toLowerCase().includes(q));
});

async function loadUsers() {
	loading.value = true;
	try {
		const res = (await GetList({ limit: 999, page: 1, show_all: '1' } as Parameters<typeof GetList>[0])) as {
			data?: UserRow[];
		};
		users.value = Array.isArray(res?.data) ? res.data : [];
	} catch {
		users.value = [];
	} finally {
		loading.value = false;
	}
}

watch(
	() => props.visible,
	(val) => {
		if (!val) return;
		searchVal.value = '';
		checkedIds.value = props.data.filter((item) => item.type === 1).map((item) => item.targetId);
		loadUsers();
	}
);

function closeDialog() {
	emit('update:visible', false);
}

function saveDialog() {
	const selected = users.value
		.filter((u) => checkedIds.value.includes(u.id))
		.map((u) => ({
			type: 1,
			targetId: u.id,
			name: u.name || u.username,
		}));
	emit('change', selected);
	closeDialog();
}
</script>

<style scoped>
.kg-wf-user-search {
	margin-bottom: 12px;
}

.kg-wf-user-list {
	max-height: 360px;
	overflow: auto;
}

.kg-wf-user-item {
	display: block;
	padding: 6px 0;
}
</style>
