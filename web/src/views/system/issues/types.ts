export type IssueViewMode = 'active' | 'archived' | 'deleted' | 'hot';

export type IssueStatus = 'processing' | 'pendingCause' | 'pendingApproval' | 'done';
export type IssueCategory = 'qualityComplaint' | 'techConsult' | 'fieldSupport';
export type IssueSeverity = 'highSafety';

export interface IssueListItem {
	id: string;
	title: string;
	category: string;
	product: string;
	status: string;
	priority: string;
	owner: string;
	date: string;
	isArchived: boolean;
	isDeleted: boolean;
	isHot: boolean;
}

export type StorylineItemType = 'chat' | 'system' | 'file' | 'queen_widget';

export interface StorylineItem {
	id: string;
	type: StorylineItemType;
	sender?: string;
	avatar?: string;
	content: string;
	timestamp: string;
	widgetType?: 'fishbone' | 'task_card' | 'knowledge_card';
	widgetData?: Record<string, string>;
}

export interface D8Step {
	id: string;
	name: string;
	status: 'done' | 'in-progress' | 'pending';
}

export interface GanttTask {
	id: string;
	name: string;
	start: string;
	end: string;
	progress: number;
	status: 'done' | 'in-progress' | 'pending';
	assignee: string;
	phase: string;
}
