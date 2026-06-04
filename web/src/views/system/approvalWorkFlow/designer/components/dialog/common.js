import { ref } from 'vue';
import $func from '../../utils/index.js';
import { getRoles } from '../../api/conditions';
import { GetList } from '/@/views/system/user/api';

export const searchVal = ref('');
export const departments = ref({
	titleDepartments: [],
	childDepartments: [],
	employees: [],
});
export const roles = ref([]);

export async function getRoleList() {
	const res = await getRoles();
	roles.value = Array.isArray(res?.data) ? res.data : [];
}

export async function getDepartmentList() {
	const res = await GetList({ limit: 999, page: 1, show_all: '1' });
	const list = Array.isArray(res?.data) ? res.data : [];
	departments.value = {
		titleDepartments: [],
		childDepartments: [],
		employees: list.map((u) => ({
			id: u.id,
			employeeName: u.name || u.username,
		})),
	};
}

function readSearchValue(event) {
	if (typeof event === 'string') return event;
	return event?.target?.value ?? searchVal.value ?? '';
}

export function getDebounceData(event, type = 1) {
	$func.debounce(async () => {
		const keyword = String(readSearchValue(event)).trim().toLowerCase();
		if (keyword) {
			if (type === 1) {
				await getDepartmentList();
				departments.value.employees = departments.value.employees.filter((item) =>
					String(item.employeeName || '')
						.toLowerCase()
						.includes(keyword)
				);
			} else {
				await getRoleList();
				roles.value = roles.value.filter((item) =>
					String(item.roleName || '')
						.toLowerCase()
						.includes(keyword)
				);
			}
		} else if (type === 1) {
			await getDepartmentList();
		} else {
			await getRoleList();
		}
	})();
}
