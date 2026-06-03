import { defineStore } from 'pinia';

type DrawerPayload<T> = {
	value: T;
	flag: boolean;
	id: number;
};

type ConditionsConfig = {
	conditionNodes: unknown[];
	value?: unknown;
	flag?: boolean;
	id?: number;
};

export const useWorkflowDesignerStore = defineStore('workflowDesigner', {
	state: () => ({
		tableId: '' as string | number,
		isTried: false,
		promoterDrawer: false,
		flowPermission1: {} as DrawerPayload<unknown[]>,
		approverDrawer: false,
		approverConfig1: {} as DrawerPayload<Record<string, unknown>>,
		copyerDrawer: false,
		copyerConfig1: {} as DrawerPayload<Record<string, unknown>>,
		conditionDrawer: false,
		conditionsConfig1: { conditionNodes: [] } as ConditionsConfig,
	}),
	actions: {
		setTableId(payload: string | number) {
			this.tableId = payload;
		},
		setIsTried(payload: boolean) {
			this.isTried = payload;
		},
		setPromoter(payload: boolean) {
			this.promoterDrawer = payload;
		},
		setFlowPermission(payload: DrawerPayload<unknown[]>) {
			this.flowPermission1 = payload;
		},
		setApprover(payload: boolean) {
			this.approverDrawer = payload;
		},
		setApproverConfig(payload: DrawerPayload<Record<string, unknown>>) {
			this.approverConfig1 = payload;
		},
		setCopyer(payload: boolean) {
			this.copyerDrawer = payload;
		},
		setCopyerConfig(payload: DrawerPayload<Record<string, unknown>>) {
			this.copyerConfig1 = payload;
		},
		setCondition(payload: boolean) {
			this.conditionDrawer = payload;
		},
		setConditionsConfig(payload: ConditionsConfig) {
			this.conditionsConfig1 = payload;
		},
	},
});
