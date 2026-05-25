import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { FRONTEND_MENU_ROUTES } from '/@/router/frontendMenuRoutes';
import { setTagsViewNameI18n } from '/@/utils/other';
import type { BreadcrumbExtraItem } from '/@/stores/breadcrumbExtras';

export type BreadcrumbParentMeta = {
	title: string;
	path?: string;
};

function isBusinessRoute(route: RouteLocationNormalizedLoaded): boolean {
	const name = String(route.name ?? '');
	if (name.startsWith('kg-') || name === 'home' || name === 'kg-home-page') return true;
	return FRONTEND_MENU_ROUTES.some((m) => route.path === m.path || route.path.startsWith(`${m.path}/`));
}

function crumbFromMeta(parent: BreadcrumbParentMeta): RouteItem {
	return {
		path: parent.path ?? '',
		meta: { title: parent.title },
		children: [],
	};
}

function getDeepestBreadcrumbParents(route: RouteLocationNormalizedLoaded): BreadcrumbParentMeta[] | undefined {
	for (let i = route.matched.length - 1; i >= 0; i--) {
		const parents = route.matched[i].meta?.breadcrumbParents as BreadcrumbParentMeta[] | undefined;
		if (parents?.length) return parents;
	}
	return undefined;
}

function pushNavigateTarget(list: RouteItem[], path: string, meta: RouteItem['meta']) {
	const last = list[list.length - 1];
	if (last?.path === path && last?.meta?.title === meta?.title) return;
	list.push({ path, meta, children: [] });
}

/** 不参与面包屑的路由（layout 通配 404/401 等） */
function shouldIncludeMatchedRecord(name: string, title: unknown): boolean {
	if (name === '/' || name === 'home' || name === 'kg-home-page') return false;
	if (name === 'notFound' || name === 'noPower') return false;
	return Boolean(title);
}

/** 质量中心等业务路由：matched + meta.breadcrumbParents + 动态 extras */
function buildBusinessBreadcrumb(
	route: RouteLocationNormalizedLoaded,
	extras: BreadcrumbExtraItem[]
): RouteItem[] {
	const list: RouteItem[] = [];
	const parents = getDeepestBreadcrumbParents(route);
	if (parents?.length) {
		parents.forEach((p) => list.push(crumbFromMeta(p)));
	} else {
		const titled = route.matched.filter((record) =>
			shouldIncludeMatchedRecord(String(record.name ?? ''), record.meta?.title)
		);
		titled.slice(0, -1).forEach((record) => {
			const path = record.path.includes(':') ? `/${route.path.split('/').filter(Boolean).slice(0, 1).join('/')}` : record.path;
			pushNavigateTarget(list, path, { title: record.meta!.title as string, icon: record.meta?.icon as string | undefined });
		});
	}
	extras.forEach((item) => pushNavigateTarget(list, item.path ?? '', { title: item.title }));
	pushNavigateTarget(list, route.fullPath, {
		title: (route.meta?.title as string) || '',
		tagsViewName: setTagsViewNameI18n(route),
		icon: route.meta?.icon as string | undefined,
	});
	return list;
}

/** 平台后端菜单路由：沿用 routesList 按 path 分段匹配 */
function buildPlatformBreadcrumb(route: RouteLocationNormalizedLoaded, routesList: RouteItems): RouteItem[] {
	const list: RouteItem[] = [];
	if (!routesList.length) return list;
	list.push({ ...routesList[0], children: routesList[0].children ?? [] });

	const segments = route.path.split('/').filter(Boolean);
	let pathAcc = '';
	let levelRoutes = routesList;
	let segIndex = 0;

	while (segIndex < segments.length && levelRoutes?.length) {
		pathAcc += `/${segments[segIndex]}`;
		const hit = levelRoutes.find((item) => item.path === pathAcc);
		if (hit) {
			list.push({ ...hit, children: hit.children ?? [] });
			levelRoutes = hit.children ?? [];
		}
		segIndex++;
	}

	if (route.name === 'home' || (route.name === 'notFound' && list.length > 1)) {
		list.shift();
	}
	if (list.length > 0) {
		const last = list[list.length - 1];
		last.meta = {
			...last.meta,
			tagsViewName: setTagsViewNameI18n(route),
		};
	}
	return list;
}

export function buildBreadcrumbList(
	route: RouteLocationNormalizedLoaded,
	routesList: RouteItems,
	extras: BreadcrumbExtraItem[] = []
): RouteItem[] {
	if (isBusinessRoute(route)) {
		return buildBusinessBreadcrumb(route, extras);
	}
	return buildPlatformBreadcrumb(route, routesList);
}

/** 支持 path?query= 的导航 */
export function navigateBreadcrumb(router: { push: (to: any) => void }, item: RouteItem) {
	const { redirect, path } = item;
	if (redirect) {
		router.push(redirect);
		return;
	}
	if (!path) return;
	if (path.includes('?')) {
		const [pathname, search] = path.split('?');
		const query = Object.fromEntries(new URLSearchParams(search));
		router.push({ path: pathname, query });
		return;
	}
	router.push(path);
}
