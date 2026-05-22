/**
 * 质量中心 / 知识图谱 — 前端业务路由（与 /home 平级，不写入后端菜单库）
 * component 为 views 路径字符串，由 backEndComponent / registerBusinessRoutes 解析。
 */

export type BusinessRouteRaw = {
	path: string;
	name: string;
	component?: string;
	redirect?: string;
	meta: Record<string, unknown>;
	children?: BusinessRouteRaw[];
};

const layout = '/system/qualityLayout/index';

const hiddenMeta = {
	isLink: '',
	isHide: true,
	isKeepAlive: true,
	isAffix: false,
	isIframe: false,
	roles: ['admin'],
};

/** 带动态参数的子页不缓存，避免 :id 切换串页 */
const noCacheMeta = {
	...hiddenMeta,
	isKeepAlive: false,
};

/** 平台左侧菜单仅展示工作台 */
export function getBusinessMenuRoute(): BusinessRouteRaw {
	return {
		path: '/home',
		name: 'home',
		component: layout,
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

function shell(path: string, name: string, title: string, pageComponent: string, childPaths?: BusinessRouteRaw[]): BusinessRouteRaw {
	const children: BusinessRouteRaw[] = [{ path: '', name: `${name}-index`, component: pageComponent, meta: { ...hiddenMeta, title } }, ...(childPaths || [])];
	return { path, name, component: layout, meta: { ...hiddenMeta, title }, children };
}

/** 九项一级 + 辅助路由（含 children，须 registerBusinessRoutes 挂载） */
export function getBusinessRoutes(): BusinessRouteRaw[] {
	return [
		{
			...getBusinessMenuRoute(),
			children: [{ path: '', name: 'kg-home-page', component: '/system/home/index', meta: { ...hiddenMeta, title: 'message.pages.home.title' } }],
		},
		shell('/issues', 'kg-issues', 'message.pages.issues.title', '/system/issues/index', [
			{ path: 'new', name: 'kg-issues-create', component: '/system/issues/create/index', meta: { ...noCacheMeta, title: 'message.pages.issues.create' } },
			{ path: ':id', name: 'kg-issues-detail', component: '/system/issues/detail/index', meta: { ...noCacheMeta, title: 'message.pages.issues.detail' } },
		]),
		shell('/document-management', 'kg-documents', 'message.pages.documentManagement.title', '/system/documentManagement/index', [
			{ path: 'bom/:id/extract', name: 'kg-bom-workbench', component: '/system/bom/workbench/index', meta: { ...noCacheMeta, title: 'message.pages.bom.workbench' } },
			{ path: 'quality/new', name: 'kg-quality-docs-create', component: '/system/qualityDocs/create/index', meta: { ...noCacheMeta, title: 'message.pages.qualityDocs.create' } },
			{ path: 'quality/:id', name: 'kg-quality-docs-detail', component: '/system/qualityDocs/detail/index', meta: { ...noCacheMeta, title: 'message.pages.qualityDocs.detail' } },
		]),
		shell('/schema', 'kg-schema', 'message.pages.schema.title', '/system/schema/index'),
		shell('/knowledge', 'kg-knowledge', 'message.pages.knowledge.title', '/system/knowledge/index', [
			{ path: ':id', name: 'kg-knowledge-detail', component: '/system/knowledge/index', meta: { ...noCacheMeta, title: 'message.pages.knowledge.detail' } },
		]),
		shell('/analytics', 'kg-analytics', 'message.pages.analytics.title', '/system/analytics/index'),
		shell('/admin', 'kg-admin', 'message.pages.admin.title', '/system/admin/index'),
		shell('/audit', 'kg-audit', 'message.pages.audit.title', '/system/audit/index'),
		shell('/tasks', 'kg-tasks', 'message.pages.qualityTask.title', '/system/qualityTask/index'),
		shell('/rca', 'kg-rca', 'message.pages.rca.title', '/system/rca/index', [
			{ path: ':id', name: 'kg-rca-detail', component: '/system/rca/index', meta: { ...noCacheMeta, title: 'message.pages.rca.detail' } },
		]),
		shell('/8d-reports', 'kg-8d', 'message.pages.report8d.title', '/system/report8d/index', [
			{ path: ':id', name: 'kg-8d-detail', component: '/system/report8d/index', meta: { ...noCacheMeta, title: 'message.pages.report8d.detail' } },
		]),
		shell('/ai-assistant', 'kg-ai', 'message.pages.aiAssistant.title', '/system/aiAssistant/index'),
		shell('/notifications', 'kg-notifications', 'message.pages.notifications.title', '/system/notifications/index'),
		// 旧路径兼容重定向
		{ path: '/bom-management', name: 'kg-bom-legacy', redirect: '/document-management?tab=bom', meta: hiddenMeta },
		{ path: '/bom-management/:id/extract', name: 'kg-bom-workbench-legacy', redirect: '/document-management/bom/:id/extract', meta: hiddenMeta },
		{ path: '/quality-docs', name: 'kg-quality-docs-legacy', redirect: '/document-management?tab=quality', meta: hiddenMeta },
		{ path: '/quality-docs/new', name: 'kg-quality-docs-create-legacy', redirect: '/document-management/quality/new', meta: hiddenMeta },
		{ path: '/quality-docs/:id', name: 'kg-quality-docs-detail-legacy', redirect: '/document-management/quality/:id', meta: hiddenMeta },
	];
}
