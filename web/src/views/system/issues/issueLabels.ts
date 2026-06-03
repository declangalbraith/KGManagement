import { useI18n } from 'vue-i18n';
import type { IssueCategory, IssueSeverity, IssueStatus } from './types';

const ISSUE_MOCK_KEYS: Record<string, string> = {
	'ISS-202604-001': 'iss202604001',
};

export function useIssueLabels() {
	const { t, te } = useI18n();

	const emptyLabel = () => t('message.pages.issues.emptyValue');

	const statusLabel = (status: IssueStatus | string) => {
		const map: Record<IssueStatus, string> = {
			processing: t('message.pages.issues.statusProcessing'),
			pendingCause: t('message.pages.issues.statusPendingCause'),
			pendingApproval: t('message.pages.issues.statusPendingApproval'),
			done: t('message.pages.issues.statusCompleted'),
		};
		return map[status as IssueStatus] ?? status;
	};

	const categoryLabel = (category: IssueCategory | string) => {
		const map: Record<IssueCategory, string> = {
			qualityComplaint: t('message.pages.issues.categoryQualityComplaint'),
			techConsult: t('message.pages.issues.categoryTechConsult'),
			fieldSupport: t('message.pages.issues.categoryFieldSupport'),
		};
		return map[category as IssueCategory] ?? category;
	};

	const severityLabel = (severity: IssueSeverity | string) => {
		const map: Record<IssueSeverity, string> = {
			highSafety: t('message.pages.issues.severityHighSafety'),
		};
		return map[severity as IssueSeverity] ?? severity;
	};

	const issueMockKey = (issueId: string) => ISSUE_MOCK_KEYS[issueId];

	const issueMockField = (issueId: string, field: string) => {
		const key = issueMockKey(issueId);
		if (!key) return '';
		const i18nKey = `message.pages.issues.mocks.${key}.${field}`;
		return te(i18nKey) ? t(i18nKey) : '';
	};

	const issueMockTitle = (issueId: string) => issueMockField(issueId, 'title') || t('message.pages.issues.detail');

	const issueMockDescriptions = (issueId: string): string[] => {
		const key = issueMockKey(issueId);
		if (!key) return [t('message.pages.issues.noDescription')];
		const descs: string[] = [];
		for (let i = 1; i <= 5; i++) {
			const i18nKey = `message.pages.issues.mocks.${key}.desc${i}`;
			if (te(i18nKey)) descs.push(t(i18nKey));
		}
		return descs.length ? descs : [t('message.pages.issues.noDescription')];
	};

	return {
		emptyLabel,
		statusLabel,
		categoryLabel,
		severityLabel,
		issueMockTitle,
		issueMockDescriptions,
		issueMockField,
	};
}
