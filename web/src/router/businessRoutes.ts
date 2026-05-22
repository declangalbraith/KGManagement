/**
 * 质量中心业务路由 — 由 frontendMenuRoutes 菜单列表生成
 * @see /@/router/frontendMenuRoutes.ts 在此维护菜单与路由
 */

export type { BusinessRouteRaw } from '/@/router/frontendMenuRoutes';

export {
	buildBusinessRoutesFromMenu as getBusinessRoutes,
	getBusinessMenuRouteFromConfig as getBusinessMenuRoute,
} from '/@/router/frontendMenuRoutes';
