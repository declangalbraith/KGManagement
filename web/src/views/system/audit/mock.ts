export interface AuditLogItem {
	id: string;
	time: string;
	user: string;
	action: string;
	module: string;
	target: string;
	ip: string;
}

export const auditLogs: AuditLogItem[] = [
	{ id: '1', time: '2026-04-11 10:23:45', user: '张三', action: '审批通过', module: '8D报告', target: '8D-202604-003', ip: '192.168.1.105' },
	{ id: '2', time: '2026-04-11 09:15:22', user: '李四', action: '更新状态', module: '问题管理', target: 'ISS-202604-001', ip: '192.168.1.112' },
	{ id: '3', time: '2026-04-10 16:45:10', user: '王五', action: '导出数据', module: '数据分析', target: '本月质量报表', ip: '192.168.1.88' },
	{ id: '4', time: '2026-04-10 14:30:00', user: '赵六', action: '创建任务', module: '子任务', target: 'TSK-202604-004', ip: '192.168.1.95' },
	{ id: '5', time: '2026-04-10 09:30:15', user: '张三', action: '创建问题', module: '问题管理', target: 'ISS-202604-001', ip: '192.168.1.105' },
];
