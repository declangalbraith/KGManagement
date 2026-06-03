import { request } from '/@/utils/service';

export interface WorkflowStep {
	id?: number;
	step_order: number;
	step_name?: string;
	assignee_id: number;
	assignee_name?: string;
}

export interface WorkflowDefinition {
	id: number;
	code: string;
	name: string;
	doc_type_id: number | null;
	doc_type_name: string | null;
	is_active: boolean;
	definition_json: Record<string, unknown> | null;
	steps: WorkflowStep[];
	create_datetime: string;
	update_datetime: string;
}

export interface WorkflowTask {
	id: number;
	instance_id: number;
	step_order: number;
	assignee_id: number;
	assignee_name: string;
	status: 'pending' | 'approved' | 'rejected';
	comment: string;
	acted_at: string | null;
	biz_type: string;
	biz_id: number;
	document_name: string;
	document_version: string;
	workflow_name: string;
	create_datetime: string;
}

export interface WorkflowAuditLog {
	id: number;
	action: string;
	operator_name: string;
	message: string;
	detail: string;
	create_datetime: string;
}

type DvAdminResponse<T> = { code?: number; data?: T; msg?: string };

function unwrapList<T>(res: DvAdminResponse<T[]> | T[]): T[] {
	if (Array.isArray(res)) return res;
	if (res?.code === 2000 && Array.isArray(res.data)) return res.data;
	return [];
}

function unwrapItem<T>(res: DvAdminResponse<T> | T): T {
	if (res && typeof res === 'object' && 'code' in res && (res as DvAdminResponse<T>).code === 2000) {
		return (res as DvAdminResponse<T>).data as T;
	}
	return res as T;
}

export function fetchWorkflowDefinitions(params?: {
	doc_type_id?: number;
	is_active?: boolean;
}): Promise<WorkflowDefinition[]> {
	return request({
		url: '/api/workflow/definitions/',
		method: 'get',
		params,
	}).then((res: DvAdminResponse<WorkflowDefinition[]> | WorkflowDefinition[]) => unwrapList<WorkflowDefinition>(res));
}

export function createWorkflowDefinition(data: Partial<WorkflowDefinition> & { steps: WorkflowStep[] }): Promise<WorkflowDefinition> {
	return request({
		url: '/api/workflow/definitions/',
		method: 'post',
		data,
	}).then((res: DvAdminResponse<WorkflowDefinition> | WorkflowDefinition) => unwrapItem<WorkflowDefinition>(res));
}

export function updateWorkflowDefinition(
	id: number,
	data: Partial<WorkflowDefinition> & { steps?: WorkflowStep[] }
): Promise<WorkflowDefinition> {
	return request({
		url: `/api/workflow/definitions/${id}/`,
		method: 'put',
		data,
	}).then((res: DvAdminResponse<WorkflowDefinition> | WorkflowDefinition) => unwrapItem<WorkflowDefinition>(res));
}

export function deleteWorkflowDefinition(id: number): Promise<void> {
	return request({
		url: `/api/workflow/definitions/${id}/`,
		method: 'delete',
	}).then(() => undefined);
}

export function fetchMyWorkflowTasks(status = 'pending'): Promise<WorkflowTask[]> {
	return request({
		url: '/api/workflow/tasks/',
		method: 'get',
		params: { status, mine: true },
	}).then((res: DvAdminResponse<WorkflowTask[]> | WorkflowTask[]) => unwrapList<WorkflowTask>(res));
}

export function approveWorkflowTask(taskId: number): Promise<WorkflowTask> {
	return request({
		url: `/api/workflow/tasks/${taskId}/approve/`,
		method: 'post',
	}).then((res: DvAdminResponse<WorkflowTask> | WorkflowTask) => unwrapItem<WorkflowTask>(res));
}

export function rejectWorkflowTask(taskId: number, comment?: string): Promise<WorkflowTask> {
	return request({
		url: `/api/workflow/tasks/${taskId}/reject/`,
		method: 'post',
		data: { comment: comment || '' },
	}).then((res: DvAdminResponse<WorkflowTask> | WorkflowTask) => unwrapItem<WorkflowTask>(res));
}
