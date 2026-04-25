import type { PageServerLoad } from './$types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const q             = url.searchParams.get('q') ?? '';
	const date_from     = url.searchParams.get('date_from') ?? '';
	const date_to       = url.searchParams.get('date_to') ?? '';
	const group         = url.searchParams.get('group') ?? '';
	const proposals_only = url.searchParams.get('proposals_only') !== 'false';

	const params = new URLSearchParams({ limit: '20', offset: '0' });
	if (q)              params.set('q', q);
	if (date_from)      params.set('date_from', date_from);
	if (date_to)        params.set('date_to', date_to);
	if (group)          params.set('group', group);
	if (!proposals_only) params.set('proposals_only', 'false');

	const res = await fetch(`${API_BASE}/votes?${params}`);
	const votes = res.ok ? await res.json() : [];

	return { votes, q, date_from, date_to, group, proposals_only };
};
