export const CONDITION_FIELDS: Array<Record<string, unknown>> = [];

export function getConditions() {
	return Promise.resolve({ data: CONDITION_FIELDS });
}

export function getRoles() {
	return Promise.resolve({ data: [] });
}
