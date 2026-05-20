import type { CommunityNode, EntityNode, RelationNode } from './types';

export const mockCommunities: CommunityNode[] = [
	{ id: 'com-1', name: '设备对象社区', nameEn: 'Device Assets', domain: '资产域', members: 12, desc: '承载所有硬件实体及其装配关系', owner: '张工' },
	{ id: 'com-2', name: '故障问题社区', nameEn: 'Faults & Issues', domain: '质量域', members: 8, desc: '质量及现场维保问题记录与分析', owner: '李工' },
	{ id: 'com-3', name: '维修维护社区', nameEn: 'Maintenance', domain: '服务域', members: 15, desc: '工单与维护操作规范定义', owner: '王工' },
];

export const mockEntities: EntityNode[] = [
	{
		id: 'ent-001',
		name: '空压机主机',
		nameEn: 'Compressor Main Unit',
		domain: '设备资产',
		communities: ['com-1'],
		x: 120,
		y: 80,
		properties: [
			{ name: '额定功率', type: 'Number', required: true },
			{ name: '工作压力', type: 'Number', required: true },
		],
		impact: { instances: 2450, models: 5, risk: 'High' },
	},
	{
		id: 'ent-002',
		name: '故障模式',
		nameEn: 'Failure Mode',
		domain: '质量可靠性',
		communities: ['com-2'],
		x: 380,
		y: 80,
		properties: [
			{ name: '故障代码', type: 'String', required: true },
			{ name: '严重度', type: 'Enum', required: true },
		],
		impact: { instances: 12500, models: 12, risk: 'High' },
	},
	{
		id: 'ent-003',
		name: '控制板卡',
		nameEn: 'Control Board',
		domain: '电气控制',
		communities: ['com-1'],
		x: 120,
		y: 220,
		properties: [{ name: '固件版本', type: 'String', required: true }],
		impact: { instances: 860, models: 2, risk: 'Medium' },
	},
];

export const mockRelations: RelationNode[] = [
	{
		id: 'rel-1',
		name: '具有包含关系',
		nameEn: 'Contains',
		sourceId: 'ent-001',
		targetId: 'ent-003',
		semantics: { desc: '物理或逻辑包含关系', multiValue: true, required: false, inverse: true },
		usage: { communities: ['com-1'], instanceCount: 15600 },
		impact: { instances: 15600, models: 3, risk: 'Medium' },
	},
	{
		id: 'rel-2',
		name: '具有故障',
		nameEn: 'Has_Failure',
		sourceId: 'ent-001',
		targetId: 'ent-002',
		semantics: { desc: '设备发生了已知失效模式', multiValue: true, required: false, inverse: false },
		usage: { communities: ['com-1', 'com-2'], instanceCount: 4200 },
		impact: { instances: 4200, models: 8, risk: 'High' },
	},
];
