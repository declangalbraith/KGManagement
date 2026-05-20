import type { BomRecord, BomTreeNode } from './types';

export const bomList: BomRecord[] = [
	{ id: 'bom-001', name: '75kW 螺杆空压机主 BOM', code: 'BOM-KB75-001', version: 'V3.0', deviceModel: 'KB 75kW 螺杆空压机', productLine: '工业空压机系列', uploader: '张工', uploadTime: '2024-05-18 10:30', updateTime: '2024-05-18 14:20', status: 'Active', ingestStatus: 'Partial' },
	{ id: 'bom-002', name: '110kW 变频空压机 BOM', code: 'BOM-KB110-002', version: 'V1.0', deviceModel: 'KB 110kW 变频', productLine: '工业空压机系列', uploader: '李工', uploadTime: '2024-05-15 09:15', updateTime: '2024-05-15 09:15', status: 'Draft', ingestStatus: 'Pending' },
	{ id: 'bom-003', name: '微油螺杆机标准版 BOM', code: 'BOM-KB37-005', version: 'V2.1', deviceModel: 'KB 37kW 标准版', productLine: '微油机系列', uploader: '王工', uploadTime: '2024-05-10 16:45', updateTime: '2024-05-12 11:20', status: 'Active', ingestStatus: 'Complete' },
];

export const workbenchTree: BomTreeNode = {
	id: 'root',
	name: 'KB 75kW 螺杆空压机总成',
	code: 'KB-75KW-00',
	level: 0,
	spec: '75kW, 8bar',
	status: 'Pending',
	children: [
		{
			id: 'n1',
			name: '主机头总成',
			code: 'KB-75-HA-01',
			level: 1,
			spec: '标准',
			status: 'Pending',
			children: [
				{ id: 'n1-1', name: '主轴承', code: 'BRG-001', level: 2, spec: 'D45', status: 'Ingested' },
				{ id: 'n1-2', name: '阴阳转子', code: 'RTR-002', level: 2, spec: '75kW', status: 'Pending' },
			],
		},
		{
			id: 'n2',
			name: '油气分离系统',
			code: 'KB-75-OS-02',
			level: 1,
			spec: '综合',
			status: 'Pending',
			children: [{ id: 'n2-1', name: '油气分离罐', code: 'TNK-01', level: 2, spec: '300L', status: 'Pending' }],
		},
	],
};
