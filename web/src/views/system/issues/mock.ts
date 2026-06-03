import type { D8Step, GanttTask, IssueListItem, StorylineItem, IssueStatus } from './types';

export const initialIssues: IssueListItem[] = [
	{ id: 'ISS-202604-001', title: '制动盘表面出现异常磨损', category: '质量投诉', product: '制动盘', status: '处理中', priority: '高', owner: '李四', date: '2026-04-10', isArchived: false, isDeleted: false, isHot: true },
	{ id: 'ISS-202604-002', title: '空压机异响问题排查', category: '技术咨询', product: '空压机', status: '待确认原因', priority: '中', owner: '王五', date: '2026-04-09', isArchived: false, isDeleted: false, isHot: false },
	{ id: 'ISS-202604-003', title: '控制阀漏气现象', category: '质量投诉', product: '控制阀', status: '待审批', priority: '紧急', owner: '张三', date: '2026-04-08', isArchived: false, isDeleted: false, isHot: false },
	{ id: 'ISS-202604-004', title: '传感器信号不稳定', category: '现场支持', product: '传感器', status: '已完成', priority: '低', owner: '赵六', date: '2026-04-05', isArchived: false, isDeleted: false, isHot: true },
];

export const mockStoryline: StorylineItem[] = [
	{ id: '1', type: 'system', content: '李四 创建了问题单', timestamp: '昨天 10:00' },
	{ id: '2', type: 'chat', sender: '李四', avatar: '李', content: '已安排现场人员进行数据采集，预计明天上午能拿到初步的硬度测试报告。', timestamp: '昨天 14:30' },
	{ id: '3', type: 'queen_widget', sender: 'Queen', content: '根据历史知识库，2024年曾发生过类似问题 (ISS-202408-012)。建议重点排查近期闸瓦的入厂检验记录。', timestamp: '昨天 14:32' },
	{ id: '4', type: 'file', content: '硬度测试报告_v1.pdf', timestamp: '今天 09:15' },
];

export const defaultD8Steps: D8Step[] = [
	{ id: 'D0', name: '准备', status: 'done' },
	{ id: 'D1', name: '成立团队', status: 'done' },
	{ id: 'D2', name: '问题描述', status: 'done' },
	{ id: 'D3', name: '临时围堵', status: 'in-progress' },
	{ id: 'D4', name: '根本原因', status: 'pending' },
	{ id: 'D5', name: '永久纠正', status: 'pending' },
	{ id: 'D6', name: '验证措施', status: 'pending' },
	{ id: 'D7', name: '预防再发', status: 'pending' },
	{ id: 'D8', name: '团队认可', status: 'pending' },
];

export const defaultGanttTasks: GanttTask[] = [
	{ id: 'TSK-001', name: '现场数据采集与拍照', start: '2026-04-08', end: '2026-04-10', progress: 100, status: 'done', assignee: '王工程师', phase: 'D2' },
	{ id: 'TSK-002', name: '材料硬度测试分析', start: '2026-04-10', end: '2026-04-14', progress: 60, status: 'in-progress', assignee: '李研究员', phase: 'D4' },
];

export const issueDetailById: Record<string, { status: IssueStatus; creator: string; createdAt: string }> = {
	'ISS-202604-001': { status: 'processing', creator: '张三', createdAt: '2026-04-10 09:30' },
};
