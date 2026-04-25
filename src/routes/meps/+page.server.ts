import type { PageServerLoad } from './$types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const load: PageServerLoad = async ({ fetch }) => {
	const [first, second] = await Promise.all([
		fetch(`${API_BASE}/meps?limit=500&offset=0`),
		fetch(`${API_BASE}/meps?limit=500&offset=500`),
	]);
	const meps = [
		...(first.ok ? await first.json() : []),
		...(second.ok ? await second.json() : []),
	];
	return { meps };
};
