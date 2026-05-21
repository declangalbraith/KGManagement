export type KnowledgeMgmtStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface KnowledgeMgmtItem {
	id: string;
	title: string;
	category: string;
	author: string;
	date: string;
	status: KnowledgeMgmtStatus;
	isArchived?: boolean;
	isDeleted?: boolean;
}

export const initialKnowledgeMgmtItems: KnowledgeMgmtItem[] = [
	{
		id: 'KN-001',
		title: '制动盘异常磨损的根因分析与解决案例',
		category: '历史案例',
		author: '张三',
		date: '2024-09-15',
		status: 'published',
		isArchived: false,
		isDeleted: false,
	},
	{
		id: 'KN-002',
		title: '空压机异响排查标准操作规程 (SOP)',
		category: '标准操作规程',
		author: '李四',
		date: '2024-09-18',
		status: 'pending',
		isArchived: false,
		isDeleted: false,
	},
	{
		id: 'KN-003',
		title: '8D 报告编写规范与优秀案例',
		category: '培训资料',
		author: '王五',
		date: '2024-09-20',
		status: 'draft',
		isArchived: false,
		isDeleted: false,
	},
	{
		id: 'KN-004',
		title: '列车车门防夹功能测试指南',
		category: '产品技术文档',
		author: '赵六',
		date: '2024-09-22',
		status: 'rejected',
		isArchived: false,
		isDeleted: false,
	},
	{
		id: 'KN-005',
		title: '牵引电机高温报警处理流程',
		category: '常见问题解答',
		author: '张三',
		date: '2024-09-25',
		status: 'pending',
		isArchived: false,
		isDeleted: false,
	},
];
