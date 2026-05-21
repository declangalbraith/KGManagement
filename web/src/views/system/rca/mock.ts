import type { CauseNode, RcaTool } from './types';

export const rcaTools: RcaTool[] = [
	{ id: '5why', name: '5 Why 分析', description: '通过连续追问「为什么」挖掘根本原因。' },
	{ id: 'fishbone', name: '鱼骨图 (Ishikawa)', description: '从人、机、料、法、环、测等维度分析原因。' },
	{ id: 'is-isnot', name: 'IS / IS NOT 分析', description: '界定问题边界，明确「是」与「不是」。' },
	{ id: 'flowchart', name: '流程图分析', description: '梳理流程，定位异常环节。' },
	{ id: 'sipoc', name: 'SIPOC 模型', description: '梳理供应商、输入、过程、输出与客户关系。' },
];

export const defaultFishbone: Record<string, CauseNode[]> = {
	'人员 (Man)': [
		{ id: '1', text: '操作员培训不足' },
		{ id: '2', text: '疲劳作业' },
	],
	'机器 (Machine)': [
		{ id: '3', text: '设备老化' },
		{ id: '4', text: '维护保养不及时' },
	],
	'物料 (Material)': [
		{ id: '5', text: '同批次闸瓦材质过硬', isMainCause: true },
		{ id: '6', text: '供应商变更' },
	],
	'方法 (Method)': [{ id: '7', text: '工艺参数设置错误' }],
	'测量 (Measurement)': [],
	'环境 (Environment)': [],
};

export const fishboneCategories = Object.keys(defaultFishbone);
