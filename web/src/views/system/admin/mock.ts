export const adminModules = [
	{ key: 'user', title: '用户管理', desc: '管理系统用户账号、状态启停及基本信息。', icon: 'User', route: '/system/user' },
	{ key: 'role', title: '角色与权限', desc: '配置角色权限矩阵，控制功能访问范围。', icon: 'Key', route: '/system/role' },
	{ key: 'dept', title: '组织与领域', desc: '维护组织架构与业务领域划分。', icon: 'OfficeBuilding', route: '/system/dept' },
	{ key: 'menu', title: '菜单配置', desc: '平台系统菜单与权限标识管理。', icon: 'Menu', route: '/system/menu' },
	{ key: 'dict', title: '数据字典', desc: '维护系统枚举与字典项。', icon: 'Collection', route: '/system/dictionary' },
	{ key: 'config', title: '系统配置', desc: '全局参数与集成配置。', icon: 'Setting', route: '/system/config' },
];
