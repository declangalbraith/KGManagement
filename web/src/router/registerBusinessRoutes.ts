import type { RouteRecordRaw } from 'vue-router';
import { router } from '/@/router/index';
import { backEndComponent } from '/@/router/backEnd';
import { getBusinessRoutes } from '/@/router/businessRoutes';

const LAYOUT_ROUTE_NAME = '/';

let registered = false;
const addedRouteNames: string[] = [];

function rawToRouteRecord(raw: ReturnType<typeof getBusinessRoutes>): RouteRecordRaw[] {
	const resolved = backEndComponent(JSON.parse(JSON.stringify(raw))) as RouteRecordRaw[];
	return resolved || [];
}

function collectRouteNames(route: RouteRecordRaw, names: string[]) {
	if (route.name) names.push(String(route.name));
	route.children?.forEach((c) => collectRouteNames(c, names));
}

function unregisterBusinessRoutes() {
	addedRouteNames.forEach((name) => {
		if (router.hasRoute(name)) router.removeRoute(name);
	});
	addedRouteNames.length = 0;
	registered = false;
}

/**
 * 在 setAddRoute 之后调用，向 layout 追加带 children 的业务路由（避免 formatFlatteningRoutes 打碎子路由）
 */
export function registerBusinessRoutes(force = false) {
	if (registered && !force) return;
	if (force) unregisterBusinessRoutes();

	const routes = rawToRouteRecord(getBusinessRoutes());
	routes.forEach((route) => {
		if (route.name === 'home' && route.children?.length) {
			route.children.forEach((child) => {
				if (child.name) router.addRoute('home', child);
				if (child.name) addedRouteNames.push(String(child.name));
			});
			return;
		}
		if (route.path === '/home') return;
		router.addRoute(LAYOUT_ROUTE_NAME, route);
		collectRouteNames(route, addedRouteNames);
	});
	registered = true;
}

export function resetBusinessRoutesRegistration() {
	unregisterBusinessRoutes();
}
