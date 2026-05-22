import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { issueDetailById } from '../mock';
import { issueDetailMeta } from './mock';

export function useIssueDetailMeta() {
	const route = useRoute();
	const issueId = computed(() => (route.params.id as string) || 'ISS-202604-001');

	const meta = computed(() => {
		const base = issueDetailById[issueId.value];
		const ext = issueDetailMeta[issueId.value];
		if (ext) return ext;
		return {
			title: base?.title ?? '问题详情',
			status: base?.status ?? '处理中',
			creator: base?.creator ?? '—',
			createdAt: base?.createdAt ?? '—',
			category: '—',
			product: '—',
			severity: '—',
			customer: '—',
			description: ['暂无描述'],
		};
	});

	return { issueId, meta };
}
