<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const profile = $derived(data.profile);
	const votes = $derived(data.votes);
	const summary = $derived(data.summary);

	const COUNTRY_FLAGS: Record<string, string> = {
		AUT: '🇦🇹', BEL: '🇧🇪', BGR: '🇧🇬', CYP: '🇨🇾', CZE: '🇨🇿',
		DEU: '🇩🇪', DNK: '🇩🇰', ESP: '🇪🇸', EST: '🇪🇪', FIN: '🇫🇮',
		FRA: '🇫🇷', GRC: '🇬🇷', HRV: '🇭🇷', HUN: '🇭🇺', IRL: '🇮🇪',
		ITA: '🇮🇹', LTU: '🇱🇹', LUX: '🇱🇺', LVA: '🇱🇻', MLT: '🇲🇹',
		NLD: '🇳🇱', POL: '🇵🇱', PRT: '🇵🇹', ROU: '🇷🇴', SVK: '🇸🇰',
		SVN: '🇸🇮', SWE: '🇸🇪',
	};

	function countryFlag(code: string | null): string {
		if (!code) return '';
		return COUNTRY_FLAGS[code.toUpperCase()] ?? '';
	}

	function formatDate(d: string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function positionClass(pos: string | null): string {
		if (pos === 'FOR') return 'badge-for';
		if (pos === 'AGAINST') return 'badge-against';
		if (pos === 'ABSTAIN') return 'badge-abstain';
		return 'badge-other';
	}

	function voteLabel(vote: any): string {
		return vote.label || 'Untitled vote';
	}

	function subvoteLabel(sv: any): string {
		if (sv.sub_label) {
			const parts = sv.sub_label.split(' – ');
			return parts.length >= 3 ? parts.slice(2).join(' – ') : sv.sub_label;
		}
		if (sv.vote_decision_id) {
			const match = sv.vote_decision_id.match(/DEC-\w+$/);
			if (match) return match[0];
		}
		return 'Sub-vote';
	}

	function outcomeLabel(outcome: string | null): string {
		if (!outcome) return '';
		const slug = outcome.split('/').pop() ?? '';
		return slug.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
	}

	// Expand/collapse state
	let expanded = $state(new Set<string>());
	let subvoteCache = $state(new Map<string, any[]>());
	let loading = $state(new Set<string>());

	async function toggleSubvotes(activityId: string) {
		if (expanded.has(activityId)) {
			expanded.delete(activityId);
			expanded = new Set(expanded); // trigger reactivity
			return;
		}
		expanded.add(activityId);
		expanded = new Set(expanded);

		if (!subvoteCache.has(activityId)) {
			loading.add(activityId);
			loading = new Set(loading);
			const res = await fetch(
				`/api/meps/${profile.identifier}/votes/${activityId}/subvotes`
			);
			const data = res.ok ? await res.json() : [];
			subvoteCache.set(activityId, data);
			subvoteCache = new Map(subvoteCache);
			loading.delete(activityId);
			loading = new Set(loading);
		}
	}
</script>

<svelte:head>
	<title>{profile.given_name} {profile.family_name} – KnowYourMEP</title>
</svelte:head>

<main>
	<!-- Header -->
	<header class="mep-header">
		{#if profile.photo_url}
			<img class="mep-photo" src={profile.photo_url} alt="{profile.given_name} {profile.family_name}" />
		{:else}
			<div class="mep-photo mep-photo--placeholder" aria-hidden="true"></div>
		{/if}
		<div class="mep-info">
			<h1>{profile.given_name} {profile.family_name}</h1>
			{#if profile.political_group}
				<p class="mep-party">{profile.political_group}</p>
			{/if}
			{#if profile.country}
				<p class="mep-country">{countryFlag(profile.country)} {profile.country}</p>
			{/if}
		</div>
	</header>

	<!-- AI Summary -->
	<section class="card summary-card">
		<h2>Voting Pattern Summary</h2>
		{#if summary}
			<p>{summary.summary}</p>
			<p class="summary-date">Generated {formatDate(summary.created_at)}</p>
		{:else}
			<p class="muted">Summary not yet available.</p>
		{/if}
	</section>

	<!-- Recent Votes -->
	<section class="votes-section">
		<h2>Recent Votes</h2>
		{#if votes.length === 0}
			<p class="muted">No votes recorded.</p>
		{:else}
			<div class="votes-list">
				{#each votes as vote}
					<div class="vote-card">
						<!-- Summary row -->
						<div class="vote-row">
							<span class="badge {positionClass(vote.position)}">{vote.position ?? '—'}</span>
							<div class="vote-body">
								<span class="vote-label">{voteLabel(vote)}</span>
								<span class="vote-meta">
									{formatDate(vote.activity_date)}
									{#if vote.doc_id}
										· <span class="doc-id">{vote.doc_id}</span>
									{/if}
									{#if vote.decision_outcome}
										· {outcomeLabel(vote.decision_outcome)}
									{/if}
								</span>
							</div>
							<button
								class="expand-btn"
								onclick={() => toggleSubvotes(vote.activity_id)}
								aria-label={expanded.has(vote.activity_id) ? 'Collapse sub-votes' : 'Expand sub-votes'}
							>
								{expanded.has(vote.activity_id) ? '▲' : '▼'}
							</button>
						</div>

						<!-- Sub-votes panel -->
						{#if expanded.has(vote.activity_id)}
							<div class="subvotes-panel">
								{#if loading.has(vote.activity_id)}
									<p class="subvotes-loading">Loading…</p>
								{:else}
									{@const subvotes = subvoteCache.get(vote.activity_id) ?? []}
									{#if subvotes.length <= 1}
										<p class="subvotes-empty">No additional sub-votes.</p>
									{:else}
										{#each subvotes as sv}
											<div class="subvote-row">
												<span class="badge badge-sm {positionClass(sv.position)}">{sv.position ?? '—'}</span>
												<div class="subvote-body">
													<span class="subvote-label">{subvoteLabel(sv)}</span>
													{#if sv.decision_outcome}
														<span class="subvote-meta">{outcomeLabel(sv.decision_outcome)}</span>
													{/if}
												</div>
											</div>
										{/each}
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>
</main>

<style>
	main {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}

	/* Header */
	.mep-header {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		margin-bottom: 2rem;
	}
	.mep-photo {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		background: #e5e7eb;
	}
	.mep-photo--placeholder {
		background: #d1d5db;
	}
	.mep-info h1 {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
	}
	.mep-party {
		margin: 0 0 0.25rem;
		color: #4b5563;
		font-size: 0.95rem;
	}
	.mep-country {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
	}

	/* Summary card */
	.card {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.5rem;
	}
	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: #111827;
	}
	.summary-date {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: #9ca3af;
	}
	.muted {
		color: #9ca3af;
		font-style: italic;
	}

	/* Votes section */
	.votes-section h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.75rem;
	}
	.votes-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Vote card (wrapper for row + sub-votes panel) */
	.vote-card {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	/* Summary row */
	.vote-row {
		display: grid;
		grid-template-columns: 80px 1fr auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.75rem;
	}
	.vote-row .badge {
		justify-self: center;
	}
	.vote-body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.vote-label {
		font-size: 0.88rem;
		font-weight: 500;
		color: #1f2937;
		line-height: 1.3;
	}
	.vote-meta {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.doc-id {
		font-family: monospace;
		font-size: 0.75rem;
	}

	/* Expand button */
	.expand-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.65rem;
		color: #9ca3af;
		padding: 0.25rem 0.4rem;
		border-radius: 4px;
		line-height: 1;
	}
	.expand-btn:hover {
		background: #e5e7eb;
		color: #6b7280;
	}

	/* Sub-votes panel */
	.subvotes-panel {
		border-top: 1px solid #e5e7eb;
		background: #fff;
		padding: 0.5rem 0.75rem 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.subvotes-loading,
	.subvotes-empty {
		font-size: 0.78rem;
		color: #9ca3af;
		font-style: italic;
		margin: 0;
		padding: 0.2rem 0;
	}
	.subvote-row {
		display: grid;
		grid-template-columns: 80px 1fr;
		align-items: center;
		gap: 0.5rem;
	}
	.subvote-row .badge {
		justify-self: center;
	}
	.subvote-body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.subvote-label {
		font-size: 0.82rem;
		color: #374151;
		line-height: 1.3;
	}
	.subvote-meta {
		font-size: 0.72rem;
		color: #9ca3af;
	}

	/* Badges */
	.badge {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}
	.badge-sm {
		font-size: 0.65rem;
		padding: 0.15rem 0.4rem;
	}
	.badge-for     { background: #d1fae5; color: #065f46; }
	.badge-against { background: #fee2e2; color: #991b1b; }
	.badge-abstain { background: #f3f4f6; color: #374151; }
	.badge-other   { background: #e5e7eb; color: #374151; }
</style>
