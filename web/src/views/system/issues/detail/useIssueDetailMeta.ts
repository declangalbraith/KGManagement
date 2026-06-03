import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { issueDetailById } from '../mock';
import { issueDetailMeta } from './mock';
import { useIssueLabels } from '../issueLabels';

export function useIssueDetailMeta() {
	const route = useRoute();
	const {
		emptyLabel,
		statusLabel,
		categoryLabel,
		severityLabel,
		issueMockTitle,
		issueMockDescriptions,
		issueMockField,
	} = useIssueLabels();

	const issueId = computed(() => (route.params.id as string) || 'ISS-202604-001');

	const meta = computed(() => {
		const id = issueId.value;
		const base = issueDetailById[id];
		const ext = issueDetailMeta[id];
		const status = ext?.status ?? base?.status ?? 'processing';

		return {
			title: issueMockTitle(id),
			status: statusLabel(status),
			creator: ext?.creator ?? base?.creator ?? emptyLabel(),
			createdAt: ext?.createdAt ?? base?.createdAt ?? emptyLabel(),
			category: ext ? categoryLabel(ext.category) : emptyLabel(),
			product: ext ? issueMockField(id, 'product') || emptyLabel() : emptyLabel(),
			severity: ext ? severityLabel(ext.severity) : emptyLabel(),
			customer: ext ? issueMockField(id, 'customer') || emptyLabel() : emptyLabel(),
			description: issueMockDescriptions(id),
		};
	});

	return { issueId, meta };
}
