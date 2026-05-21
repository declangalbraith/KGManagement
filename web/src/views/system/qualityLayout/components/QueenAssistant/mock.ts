export interface QuickAction {
	id: string;
	title: string;
	preview: string;
	prompt: string;
	iconTone: 'blue' | 'emerald' | 'amber' | 'purple';
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
}

export const welcomeMessage =
	'你好！我是 Knorr-Bremse 智能助手。你可以直接向我描述遇到的质量问题，或者在下方关联具体的项目和知识库，我会帮你分析故障原因、检索历史案例，并提供处置建议。';

export const quickActions: QuickAction[] = [
	{
		id: '1',
		title: '车轮踏面剥离分析',
		preview: '产品：CRH380动车组。故障描述：车轮踏面剥离...',
		prompt: '产品：CRH380动车组。故障描述：车轮踏面剥离。请分析故障原因、检索历史案例，并给出处置方案。',
		iconTone: 'blue',
	},
	{
		id: '2',
		title: '轴承温度过高报警',
		preview: '产品：转向架。故障描述：轴承温度过高报警...',
		prompt: '产品：转向架。故障描述：轴承温度过高报警。请分析可能的原因，并提供应急处置建议。',
		iconTone: 'emerald',
	},
	{
		id: '3',
		title: '绝缘测试不合格排查',
		preview: '产品：高压牵引电机。故障描述：绝缘测试不合格...',
		prompt: '产品：高压牵引电机。故障描述：绝缘测试不合格。请调取相关质量整改记录并给出排查指南。',
		iconTone: 'amber',
	},
	{
		id: '4',
		title: '制动闸片异常偏磨评估',
		preview: '产品：制动系统。故障描述：制动闸片异常偏磨...',
		prompt: '产品：制动系统。故障描述：制动闸片异常偏磨。请评估潜在风险及预防措施。',
		iconTone: 'purple',
	},
];

export const projectOptions = ['CRH380 检修项目', '地铁1号线维护项目', '复兴号质量提升专项', '城际列车制动系统改造'];
