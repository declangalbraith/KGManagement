import type { SourceContextInput } from '/@/types/eightDIntegration';

const EIGHT_D_BASE = '/quality/8d';

export function buildKnowledgeBuilderUrl(ctx?: SourceContextInput, extra?: Record<string, string>): string {
	const q = new URLSearchParams({ tab: 'builder', ...(extra || {}) });
	if (ctx?.source_module) q.set('source_module', ctx.source_module);
	if (ctx?.source_record_id) q.set('source_record_id', ctx.source_record_id);
	if (ctx?.source_record_type) q.set('source_record_type', ctx.source_record_type);
	if (ctx?.project_id) q.set('project_id', ctx.project_id);
	return `/knowledge?${q.toString()}`;
}

export function buildKnowledgeGraphUrl(docId?: string, jobId?: number): string {
	const q = new URLSearchParams({ tab: 'graph' });
	if (docId) q.set('doc_id', docId);
	if (jobId != null) q.set('job_id', String(jobId));
	return `/knowledge?${q.toString()}`;
}

export function buildKnowledgeTasksUrl(jobId?: number): string {
	const q = new URLSearchParams({ tab: 'tasks' });
	if (jobId != null) q.set('job_id', String(jobId));
	return `/knowledge?${q.toString()}`;
}

export function buildKnowledgeReviewUrl(jobId: number): string {
	return `/knowledge?tab=review&job_id=${jobId}`;
}

/** 8D standalone SPA paths (nginx /quality/8d/ proxy). */
export function eightDSpaUploadUrl(ctx?: SourceContextInput): string {
	const q = new URLSearchParams();
	if (ctx?.source_record_id) q.set('source_record_id', ctx.source_record_id);
	const qs = q.toString();
	return qs ? `${EIGHT_D_BASE}/upload?${qs}` : `${EIGHT_D_BASE}/upload`;
}

export function eightDSpaGraphUrl(docId: string): string {
	return `${EIGHT_D_BASE}/graph?doc_id=${encodeURIComponent(docId)}`;
}

export function eightDSpaDocumentUrl(docId: string): string {
	return `${EIGHT_D_BASE}/documents/${encodeURIComponent(docId)}`;
}

export function sourceContextFromIssue(issueId: string | number, projectId?: string): SourceContextInput {
	const id = String(issueId);
	return {
		source_module: 'quality_issue',
		source_record_id: id.startsWith('QI-') ? id : `QI-${id}`,
		source_record_type: 'quality_issue',
		project_id: projectId,
	};
}

export function sourceContextFrom8dReport(reportId: string, projectId?: string): SourceContextInput {
	return {
		source_module: 'quality_8d',
		source_record_id: reportId,
		source_record_type: '8d_report',
		project_id: projectId,
	};
}
