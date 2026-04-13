import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const GET: RequestHandler = async ({ params }) => {
	const { identifier, activity_id } = params;
	const res = await fetch(`${API_BASE}/meps/${identifier}/votes/${activity_id}/subvotes`);
	if (!res.ok) return json([], { status: res.status });
	return json(await res.json());
};
