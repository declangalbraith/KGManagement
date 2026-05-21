import type { D8Step, GanttTask, StorylineItem } from '../types';

export interface IssueDetailMeta {
	title: string;
	status: string;
	creator: string;
	createdAt: string;
	category: string;
	product: string;
	severity: string;
	customer: string;
	description: string[];
}

export const issueDetailMeta: Record<string, IssueDetailMeta> = {
	'ISS-202604-001': {
		title: '制动盘表面出现异常磨损',
		status: '处理中',
		creator: '张三',
		createdAt: '2026-04-10 09:30',
		category: '质量投诉',
		product: '制动盘 (BRK-D-100)',
		severity: '高 - 影响行车安全',
		customer: '北京地铁 16 号线',
		description: [
			'客户反馈在近期交付的列车上，发现部分制动盘表面存在异常的划痕和磨损现象。经过初步检查，磨损深度约为 0.5mm，分布不均匀。',
			'发生条件：运行里程约 5000km 后发现。',
			'影响范围：目前已发现 3 列车存在类似问题。',
		],
	},
};

export const detailGanttTasks: GanttTask[] = [
	{ id: 'TSK-001', name: '现场数据采集与拍照', start: '2026-04-08', end: '2026-04-10', progress: 100, status: 'done', assignee: '王工程师', phase: 'D2' },
	{ id: 'TSK-005', name: '制定临时围堵措施', start: '2026-04-09', end: '2026-04-11', progress: 100, status: 'done', assignee: '李四', phase: 'D3' },
	{ id: 'TSK-002', name: '材料硬度测试分析', start: '2026-04-10', end: '2026-04-14', progress: 60, status: 'in-progress', assignee: '李研究员', phase: 'D4' },
	{ id: 'TSK-003', name: '空压机异响音频分析', start: '2026-04-13', end: '2026-04-15', progress: 0, status: 'pending', assignee: '张三', phase: 'D4' },
];

export const detailD8Steps: D8Step[] = [
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

export const detailStoryline: StorylineItem[] = [
	{ id: '1', type: 'system', content: '李四 创建了问题单', timestamp: '昨天 10:00' },
	{ id: '2', type: 'chat', sender: '李四', avatar: '李', content: '已安排现场人员进行数据采集，预计明天上午能拿到初步的硬度测试报告。初步怀疑是同批次闸瓦材质过硬导致。', timestamp: '昨天 14:30' },
	{ id: '3', type: 'queen_widget', sender: 'Queen', content: '根据历史知识库，2024年曾发生过类似问题 (ISS-202408-012)。当时的根因是闸瓦供应商更改了配方导致摩擦系数异常。建议重点排查近期闸瓦的入厂检验记录。', timestamp: '昨天 14:32' },
	{ id: '4', type: 'file', content: '硬度测试报告_v1.pdf', timestamp: '今天 09:15' },
];

export const teamMembers = [
	{ name: '李四', role: '问题负责人', avatar: '李', primary: true },
	{ name: '王工程师', role: '现场支持', avatar: '王', primary: false },
];

export const processTimeline = [
	{ title: '处理中', sub: '当前阶段', active: true },
	{ title: '已受理', sub: '李四 - 2026-04-10 10:15', active: false },
	{ title: '已提交', sub: '张三 - 2026-04-10 09:30', active: false },
];
