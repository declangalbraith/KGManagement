import type { Report8DState } from './types';

export const defaultReport8D: Report8DState = {
	d1: '组长 (Champion): 张三 (质量总监)\n主导人 (Leader): 李四 (质量工程师)\n成员: 王五, 赵六',
	d2: '客户反馈制动盘表面异常划痕和磨损，磨损深度约 0.5mm，运行里程约 5000km 后发现，目前已影响 3 列车。',
	d3: '',
	d4: '',
	d5: '',
	d6: '',
	d7: '',
	d8: '',
};

export const sectionMeta: { key: keyof Report8DState; title: string }[] = [
	{ key: 'd1', title: 'D1: 成立团队' },
	{ key: 'd2', title: 'D2: 问题描述' },
	{ key: 'd3', title: 'D3: 临时围堵' },
	{ key: 'd4', title: 'D4: 根本原因' },
	{ key: 'd5', title: 'D5: 永久纠正' },
	{ key: 'd6', title: 'D6: 验证措施' },
	{ key: 'd7', title: 'D7: 预防再发' },
	{ key: 'd8', title: 'D8: 团队认可' },
];
