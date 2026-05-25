/**
 * 质量中心 — 前端菜单列表（单一数据源）
 *
 * 在此文件增删改菜单项，会同时影响：
 * - registerBusinessRoutes 注册的业务路由
 * - qualityLayout 左侧导航栏
 *
 * 平台顶栏菜单仍由后端接口控制（themeConfig.isRequestRoutes），与此处无关。
 */
import type { Component } from 'vue';
import {
	Connection,
	DataAnalysis,
	Document,
	Odometer,
	Reading,
	Setting,
	Tickets,
	View,
} from '@element-plus/icons-vue';

export type BusinessRouteRaw = {
	path: string;
	name: string;
	component?: string;
	redirect?: string | ((to: { params: Record<string, string | string[]> }) => string);
	meta: Record<string, unknown>;
	children?: BusinessRouteRaw[];
};

const LAYOUT = '/system/qualityLayout/index';

const hiddenMeta = {
	isLink: '',
	isHide: true,
	isKeepAlive: true,
	isAffix: false,
	isIframe: false,
	roles: ['admin'],
};

const noCacheMeta = {
	...hiddenMeta,
	isKeepAlive: false,
};

/** 子页面包屑：上一级列表页（与顶栏/侧栏模块名一致） */
function listBreadcrumbParent(title: string, path: string) {
	return [{ title, path }];
}

const documentManagementBreadcrumb = listBreadcrumbParent(
	'message.pages.documentManagement.title',
	'/document-management'
);

/** 侧边栏 + 一级业务路由配置 */
export type FrontendMenuRouteItem = {
	path: string;
	name: string;
	/** i18n key，对应 qualityLayout.sidebar.* 或 message.pages.*.title */
	title: string;
	pageComponent: string;
	/** 是否在质量中心左侧栏展示 */
	showInSidebar?: boolean;
	sidebarIcon?: Component;
	/** 子路由（详情、新建等，默认不进侧边栏） */
	extraChildren?: BusinessRouteRaw[];
};

/**
 * 手动维护的菜单列表 — 改这里即可，无需再改 Sidebar/index.vue
 */
export const FRONTEND_MENU_ROUTES: FrontendMenuRouteItem[] = [
	{
		path: '/home',
		name: 'home',
		title: 'message.pages.home.title',
		pageComponent: '/system/home/index',
		showInSidebar: true,
		sidebarIcon: Odometer,
	},
	{
		path: '/issues',
		name: 'kg-issues',
		title: 'message.pages.issues.title',
		pageComponent: '/system/issues/index',
		showInSidebar: true,
		sidebarIcon: Tickets,
		extraChildren: [
			{
				path: 'new',
				name: 'kg-issues-create',
				component: '/system/issues/create/index',
				meta: {
					...noCacheMeta,
					title: 'message.pages.issues.create',
					breadcrumbParents: listBreadcrumbParent('message.pages.issues.title', '/issues'),
				},
			},
			{
				path: ':id',
				name: 'kg-issues-detail',
				component: '/system/issues/detail/layout',
				meta: {
					...noCacheMeta,
					title: 'message.pages.issues.detail',
					breadcrumbParents: listBreadcrumbParent('message.pages.issues.title', '/issues'),
				},
				children: [
					{
						path: '',
						name: 'kg-issues-detail-overview',
						component: '/system/issues/detail/overview',
						meta: { ...noCacheMeta, title: 'message.pages.issues.detail' },
					},
					{
						path: 'tasks',
						name: 'kg-issues-detail-tasks',
						component: '/system/qualityTask/index',
						meta: {
							...noCacheMeta,
							title: 'message.pages.issues.subTasks',
							issueDetailTab: true,
							breadcrumbParents: listBreadcrumbParent('message.pages.issues.title', '/issues'),
						},
					},
					{
						path: 'rca',
						name: 'kg-issues-detail-rca',
						component: '/system/rca/index',
						meta: {
							...noCacheMeta,
							title: 'message.pages.issues.rca',
							issueDetailTab: true,
							breadcrumbParents: listBreadcrumbParent('message.pages.issues.title', '/issues'),
						},
					},
					{
						path: '8d',
						name: 'kg-issues-detail-8d',
						component: '/system/report8d/index',
						meta: {
							...noCacheMeta,
							title: 'message.pages.issues.report8d',
							issueDetailTab: true,
							breadcrumbParents: listBreadcrumbParent('message.pages.issues.title', '/issues'),
						},
					},
				],
			},
		],
	},
	{
		path: '/document-management',
		name: 'kg-documents',
		title: 'message.pages.documentManagement.title',
		pageComponent: '/system/documentManagement/index',
		showInSidebar: true,
		sidebarIcon: Document,
		extraChildren: [
			{
				path: 'bom/:id/extract',
				name: 'kg-bom-workbench',
				component: '/system/bom/workbench/index',
				meta: {
					...noCacheMeta,
					title: 'message.pages.bom.extractBreadcrumb',
					breadcrumbParents: [
						...documentManagementBreadcrumb,
						{ title: 'message.pages.bom.breadcrumbCurrent', path: '/document-management?tab=bom' },
					],
				},
			},
			{
				path: 'quality/new',
				name: 'kg-quality-docs-create',
				component: '/system/qualityDocs/create/index',
				meta: {
					...noCacheMeta,
					title: 'message.pages.qualityDocs.create',
					breadcrumbParents: [
						...documentManagementBreadcrumb,
						{ title: 'message.pages.documentManagement.tabQuality', path: '/document-management?tab=quality' },
					],
				},
			},
			{
				path: 'quality/:id',
				name: 'kg-quality-docs-detail',
				component: '/system/qualityDocs/detail/index',
				meta: {
					...noCacheMeta,
					title: 'message.pages.qualityDocs.detail',
					breadcrumbParents: [
						...documentManagementBreadcrumb,
						{ title: 'message.pages.documentManagement.tabQuality', path: '/document-management?tab=quality' },
					],
				},
			},
		],
	},
	{
		path: '/schema',
		name: 'kg-schema',
		title: 'message.pages.schema.title',
		pageComponent: '/system/schema/index',
		showInSidebar: true,
		sidebarIcon: Connection,
	},
	{
		path: '/knowledge',
		name: 'kg-knowledge',
		title: 'message.pages.knowledge.title',
		pageComponent: '/system/knowledge/index',
		showInSidebar: true,
		sidebarIcon: Reading,
		extraChildren: [
			{
				path: ':id',
				name: 'kg-knowledge-detail',
				component: '/system/knowledge/index',
				meta: {
					...noCacheMeta,
					title: 'message.pages.knowledge.detail',
					breadcrumbParents: listBreadcrumbParent('message.pages.knowledge.title', '/knowledge'),
				},
			},
		],
	},
	{
		path: '/analytics',
		name: 'kg-analytics',
		title: 'message.pages.analytics.title',
		pageComponent: '/system/analytics/index',
		showInSidebar: true,
		sidebarIcon: DataAnalysis,
	},
	{
		path: '/admin',
		name: 'kg-admin',
		title: 'message.pages.admin.title',
		pageComponent: '/system/admin/index',
		showInSidebar: true,
		sidebarIcon: Setting,
	},
	{
		path: '/audit',
		name: 'kg-audit',
		title: 'message.pages.audit.title',
		pageComponent: '/system/audit/index',
		showInSidebar: true,
		sidebarIcon: View,
	},
	// 仅注册路由，不在侧边栏展示
	{ path: '/tasks', name: 'kg-tasks', title: 'message.pages.qualityTask.title', pageComponent: '/system/qualityTask/index', showInSidebar: false },
	{
		path: '/rca',
		name: 'kg-rca',
		title: 'message.pages.rca.title',
		pageComponent: '/system/rca/index',
		showInSidebar: false,
		extraChildren: [
			{
				path: ':id',
				name: 'kg-rca-detail',
				redirect: (to) => `/issues/${to.params.id}/rca`,
				meta: { ...hiddenMeta },
			},
		],
	},
	{
		path: '/8d-reports',
		name: 'kg-8d',
		title: 'message.pages.report8d.title',
		pageComponent: '/system/report8d/index',
		showInSidebar: false,
		extraChildren: [
			{
				path: ':id',
				name: 'kg-8d-detail',
				redirect: (to) => `/issues/${to.params.id}/8d`,
				meta: { ...hiddenMeta },
			},
		],
	},
	{ path: '/ai-assistant', name: 'kg-ai', title: 'message.pages.aiAssistant.title', pageComponent: '/system/aiAssistant/index', showInSidebar: false },
	{ path: '/notifications', name: 'kg-notifications', title: 'message.pages.notifications.title', pageComponent: '/system/notifications/index', showInSidebar: false },
];

/** 侧边栏 i18n：path -> qualityLayout.sidebar 的 key（与 zh-cn 中 sidebar 字段对应） */
const SIDEBAR_I18N_BY_PATH: Record<string, string> = {
	'/home': 'message.pages.qualityLayout.sidebar.dashboard',
	'/issues': 'message.pages.qualityLayout.sidebar.issues',
	'/document-management': 'message.pages.qualityLayout.sidebar.documents',
	'/schema': 'message.pages.qualityLayout.sidebar.schema',
	'/knowledge': 'message.pages.qualityLayout.sidebar.knowledge',
	'/analytics': 'message.pages.qualityLayout.sidebar.analytics',
	'/admin': 'message.pages.qualityLayout.sidebar.admin',
	'/audit': 'message.pages.qualityLayout.sidebar.audit',
};

function shell(item: FrontendMenuRouteItem): BusinessRouteRaw {
	const { path, name, title, pageComponent, extraChildren } = item;
	const shellMeta = { ...hiddenMeta };
	const indexMeta = { ...hiddenMeta, title };
	const children: BusinessRouteRaw[] = [
		{ path: '', name: `${name}-index`, component: pageComponent, meta: indexMeta },
		...(extraChildren || []),
	];
	return { path, name, component: LAYOUT, meta: shellMeta, children };
}

/** 由菜单列表生成业务路由（供 registerBusinessRoutes） */
export function buildBusinessRoutesFromMenu(): BusinessRouteRaw[] {
	const routes = FRONTEND_MENU_ROUTES.map((item) => {
		if (item.path === '/home') {
			return {
				...getBusinessMenuRouteFromConfig(),
				children: [
					{ path: '', name: 'kg-home-page', component: item.pageComponent, meta: { ...hiddenMeta, title: item.title } },
				],
			};
		}
		return shell(item);
	});
	// 旧路径兼容
	const legacy: BusinessRouteRaw[] = [
		{ path: '/bom-management', name: 'kg-bom-legacy', redirect: '/document-management?tab=bom', meta: hiddenMeta },
		{ path: '/bom-management/:id/extract', name: 'kg-bom-workbench-legacy', redirect: '/document-management/bom/:id/extract', meta: hiddenMeta },
		{ path: '/quality-docs', name: 'kg-quality-docs-legacy', redirect: '/document-management?tab=quality', meta: hiddenMeta },
		{ path: '/quality-docs/new', name: 'kg-quality-docs-create-legacy', redirect: '/document-management/quality/new', meta: hiddenMeta },
		{ path: '/quality-docs/:id', name: 'kg-quality-docs-detail-legacy', redirect: '/document-management/quality/:id', meta: hiddenMeta },
	];
	return [...routes, ...legacy];
}

/** 质量中心左侧栏导航项 */
export function getQualitySidebarNavItems(t: (key: string) => string) {
	return FRONTEND_MENU_ROUTES.filter((m) => m.showInSidebar && m.sidebarIcon).map((m) => ({
		path: m.path,
		label: t(SIDEBAR_I18N_BY_PATH[m.path] || m.title),
		icon: m.sidebarIcon!,
	}));
}

/** 注入后端 dynamicRoutes 的 /home 壳（平台顶栏只显示工作台） */
export function getBusinessMenuRouteFromConfig(): BusinessRouteRaw {
	const home = FRONTEND_MENU_ROUTES.find((m) => m.path === '/home')!;
	return {
		path: home.path,
		name: home.name,
		component: LAYOUT,
		meta: {
			title: 'message.router.home',
			isLink: '',
			isHide: false,
			isKeepAlive: true,
			isAffix: true,
			isIframe: false,
			roles: ['admin'],
			icon: 'iconfont icon-shouye',
		},
	};
}
