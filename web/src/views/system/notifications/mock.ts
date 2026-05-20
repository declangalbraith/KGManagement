export interface NotificationItem {
	id: string;
	title: string;
	content: string;
	time: string;
	type: 'alert' | 'task' | 'approval' | 'system';
	read: boolean;
}

export const notifications: NotificationItem[] = [
	{ id: '1', title: '流程节点提醒', content: '问题 ISS-202604-001 已进入 D4 根因分析阶段，请及时处理。', time: '10 分钟前', type: 'alert', read: false },
	{ id: '2', title: '任务分配', content: '王工程师 将任务 TSK-202604-002 分配给您。', time: '1 小时前', type: 'task', read: false },
	{ id: '3', title: '审批待办', content: '8D 报告 8D-202604-003 等待您的审批。', time: '3 小时前', type: 'approval', read: false },
	{ id: '4', title: '系统公告', content: '质量中心 Vue 版迁移阶段 5 已完成，欢迎反馈。', time: '昨天', type: 'system', read: true },
	{ id: '5', title: '@我的', content: '李四 在问题单中提到了您。', time: '昨天', type: 'alert', read: true },
];
