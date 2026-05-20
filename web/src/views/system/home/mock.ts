export interface HotFeedItem {
	id: string;
	author: string;
	department: string;
	time: string;
	heat: number;
	title: string;
	content: string;
	progress: number;
	progressLabel: string;
	progressColor: string;
}

export interface DashboardTask {
	id: string;
	issueId: string;
	title: string;
	dueLabel: string;
	dueType: 'overdue' | 'today';
}

export interface ProcessNotice {
	id: string;
	issueId: string;
	time: string;
	node: string;
}

export const initialHotFeed: HotFeedItem[] = [
	{
		id: 'ISS-202605-001',
		author: '王工',
		department: '质量控制部 (上海厂)',
		time: '10 分钟前更新',
		heat: 98,
		title: '[ISS-202605-001] 高铁新型制动盘高温测试异常报警',
		content:
			'最新进展：8D 第三步（临时围堵措施）已完成并经 SQE 验证。通过修改测试台传感器的校准曲线，报警率显著下降。目前正在进行第四步（根本原因分析），初步怀疑是材料热应力导致的微小形变…',
		progress: 37.5,
		progressLabel: 'D3 完成',
		progressColor: 'var(--el-color-primary)',
	},
	{
		id: 'ISS-202604-089',
		author: '李经理',
		department: '采购部 (总部)',
		time: '2 小时前更新',
		heat: 85,
		title: '[ISS-202604-089] 供应商 A 批次阀门泄漏率超标',
		content:
			'最新进展：已启动供应商质量预警机制。供应商 8D 报告初步提交至系统。D2 描述确认泄漏点集中在密封圈接口处。我们已暂停该供应商此物料的入库检验，并安排 SQE 明天前往现场进行过程审核。',
		progress: 25,
		progressLabel: 'D2 完成',
		progressColor: '#f59e0b',
	},
];

export const dashboardTasks: DashboardTask[] = [
	{ id: '1', issueId: 'ISS-202604-001', title: '确认制动盘表面裂纹原因 (TSK-202604-1)', dueLabel: '已逾期 2 天', dueType: 'overdue' },
	{ id: '2', issueId: 'ISS-202604-002', title: '确认制动盘表面裂纹原因 (TSK-202604-2)', dueLabel: '今天截止', dueType: 'today' },
	{ id: '3', issueId: 'ISS-202604-003', title: '确认制动盘表面裂纹原因 (TSK-202604-3)', dueLabel: '今天截止', dueType: 'today' },
	{ id: '4', issueId: 'ISS-202604-004', title: '确认制动盘表面裂纹原因 (TSK-202604-4)', dueLabel: '今天截止', dueType: 'today' },
];

export const processNotices: ProcessNotice[] = [
	{ id: '1', issueId: 'ISS-202604-011', time: '2 小时前', node: '待确认原因' },
	{ id: '2', issueId: 'ISS-202604-012', time: '2 小时前', node: '待确认原因' },
];
