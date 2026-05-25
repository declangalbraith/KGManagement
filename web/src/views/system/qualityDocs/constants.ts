/** 质量文档「文件类型」选项（上传弹窗、新建页共用） */
export const QUALITY_DOC_FILE_TYPES = [
	'Control Plan',
	'C Part Checklist',
	'Process Checklist',
	'Final Checklist',
	'目视控制计划',
	'WI/SOP',
	'QMP',
	'Inspection and Test Acceptance Plan',
	'FAI 报告',
	'巡检记录',
	'终检记录',
	'8D report',
] as const;

export type QualityDocFileType = (typeof QUALITY_DOC_FILE_TYPES)[number];
