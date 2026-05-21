export type TaskApprovalStatus = '草稿' | '处理中' | '待审核' | '已完成' | '已驳回';
export type TaskPriority = '高' | '中' | '低';
export type TaskViewMode = 'active' | 'archived' | 'deleted';

export interface TaskComment {
	id: string;
	author: string;
	text: string;
	time: string;
	type: 'comment' | 'system';
}

export interface TaskAttachment {
	id: string;
	name: string;
	size: string;
}

export interface QualityTask {
	id: string;
	issueId: string;
	title: string;
	description: string;
	assignee: string;
	status: TaskApprovalStatus;
	priority: TaskPriority;
	phase: string;
	startDate: string;
	deadline: string;
	comments: TaskComment[];
	attachments: TaskAttachment[];
	isArchived?: boolean;
	isDeleted?: boolean;
}
