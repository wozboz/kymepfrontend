import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const GET: RequestHandler = async ({ params }) => {
	const res = await fetch(`${API_BASE}/votes/${params.activity_id}/groups`);
	if (!res.ok) return json([], { status: res.status });
	return json(await res.json());
};
