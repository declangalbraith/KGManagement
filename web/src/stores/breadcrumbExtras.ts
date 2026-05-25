import { defineStore } from 'pinia';

/** 插入在「当前页」之前的动态面包屑项（如 BOM 编号） */
export type BreadcrumbExtraItem = {
	title: string;
	path?: string;
};

/**
 * 业务页动态面包屑片段（由页面在 onMounted / watch 写入，onUnmounted 清除）
 */
export const useBreadcrumbExtras = defineStore('breadcrumbExtras', {
	state: () => ({
		items: [] as BreadcrumbExtraItem[],
	}),
	actions: {
		set(items: BreadcrumbExtraItem[]) {
			this.items = items;
		},
		clear() {
			this.items = [];
		},
	},
});
