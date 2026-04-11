import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_BASE_URL } from '$env/static/private';

const API_BASE = API_BASE_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { identifier } = params;

	const [profileRes, votesRes, summaryRes] = await Promise.all([
		fetch(`${API_BASE}/meps/${identifier}`),
		fetch(`${API_BASE}/meps/${identifier}/votes?limit=20`),
		fetch(`${API_BASE}/meps/${identifier}/summary`),
	]);

	if (profileRes.status === 404) {
		error(404, 'MEP not found');
	}
	if (!profileRes.ok) {
		error(503, 'Failed to load MEP data');
	}

	const profile = await profileRes.json();
	const votes = votesRes.ok ? await votesRes.json() : [];
	const summary = summaryRes.ok ? await summaryRes.json() : null;

	return { profile, votes, summary };
};
