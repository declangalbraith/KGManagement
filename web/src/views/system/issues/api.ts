import type { IssueListItem } from './types';
import { initialIssues } from './mock';

const apiPrefix = '/api/kg/issues/';

/** 首期 Mock；二期对接 Django */
export async function fetchIssueList(): Promise<IssueListItem[]> {
	return Promise.resolve([...initialIssues]);
}

export { apiPrefix };
