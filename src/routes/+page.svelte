<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import GroupBreakdownChart from '$lib/GroupBreakdownChart.svelte';

	let { data }: { data: PageData } = $props();
	const votes = $derived(data.votes);

	const GROUPS = ['ECR', 'ESN', 'NI', 'PfE', 'PPE', 'Renew', 'S&D', 'The Left', 'Verts/ALE'];

	let q             = $state(untrack(() => data.q) ?? '');
	let date_from     = $state(untrack(() => data.date_from) ?? '');
	let date_to       = $state(untrack(() => data.date_to) ?? '');
	let group         = $state(untrack(() => data.group) ?? '');
	let proposals_only = $state(untrack(() => data.proposals_only) ?? true);

	let debounceTimer: ReturnType<typeof setTimeout>;

	// Expand/collapse vote items
	let expanded = $state(new Set<string>());
	let subvoteCache = $state(new Map<string, any[]>());
	let groupCache = $state(new Map<string, any[]>());
	let loadingVotes = $state(new Set<string>());

	async function toggleVoteItems(key: string, docId: string | null, activityId: string) {
		if (expanded.has(key)) {
			expanded.delete(key);
			expanded = new Set(expanded);
			return;
		}
		expanded.add(key);
		expanded = new Set(expanded);
		if (!subvoteCache.has(key)) {
			loadingVotes.add(key);
			loadingVotes = new Set(loadingVotes);
			const itemsUrl = docId
				? `/api/votes/by-doc/${encodeURIComponent(docId)}`
				: `/api/votes/${key}/subvotes`;
			const [itemsRes, groupsRes] = await Promise.all([
				fetch(itemsUrl),
				fetch(`/api/votes/${activityId}/groups`)
			]);
			subvoteCache.set(key, itemsRes.ok ? await itemsRes.json() : []);
			groupCache.set(key, groupsRes.ok ? await groupsRes.json() : []);
			subvoteCache = new Map(subvoteCache);
			groupCache = new Map(groupCache);
			loadingVotes.delete(key);
			loadingVotes = new Set(loadingVotes);
		}
	}

	function voteTitle(vote: any): string {
		return vote.proposal_label ?? vote.label ?? 'Untitled vote';
	}

	function voteItemLabel(item: any): string {
		return item.label ?? '—';
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (q)              params.set('q', q);
		if (date_from)      params.set('date_from', date_from);
		if (date_to)        params.set('date_to', date_to);
		if (group)          params.set('group', group);
		if (!proposals_only) params.set('proposals_only', 'false');
		const qs = params.toString();
		goto(qs ? `/?${qs}` : '/', { replaceState: true });
	}

	function onSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(applyFilters, 350);
	}

	function formatDate(d: string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function outcomeLabel(outcome: string | null): string {
		if (!outcome) return '';
		return (outcome.split('/').pop() ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
	}

	function isAdopted(outcome: string | null): boolean {
		return (outcome ?? '').toUpperCase().includes('ADOPTED');
	}

	function clearFilters() {
		q = ''; date_from = ''; date_to = ''; group = ''; proposals_only = true;
		goto('/', { replaceState: true });
	}

	const hasFilters = $derived(!!(q || date_from || date_to || group || !proposals_only));
</script>

<svelte:head>
	<title>KnowYourMEP — Vote Explorer</title>
</svelte:head>

<main>
	<header class="page-header">
		<div class="page-header-top">
			<div>
				<h1>Vote Explorer</h1>
				<p class="page-subtitle">Browse and search recent European Parliament votes</p>
			</div>
			<a href="/meps" class="meps-link">Browse MEPs →</a>
		</div>
	</header>

	<!-- Filters -->
	<div class="filters">
		<div class="filter-row">
			<input
				class="filter-search"
				type="search"
				placeholder="Search votes, summaries, topics…"
				bind:value={q}
				oninput={onSearchInput}
			/>
		</div>
		<div class="filter-row filter-row--secondary">
			<div class="filter-group">
				<label for="date_from">From</label>
				<input id="date_from" type="date" bind:value={date_from} onchange={applyFilters} />
			</div>
			<div class="filter-group">
				<label for="date_to">To</label>
				<input id="date_to" type="date" bind:value={date_to} onchange={applyFilters} />
			</div>
			<div class="filter-group">
				<label for="group">Party group</label>
				<select id="group" bind:value={group} onchange={applyFilters}>
					<option value="">All groups</option>
					{#each GROUPS as g}
						<option value={g}>{g}</option>
					{/each}
				</select>
			</div>
			<label class="filter-toggle">
				<input type="checkbox" bind:checked={proposals_only} onchange={applyFilters} />
				Proposals only
			</label>
			{#if hasFilters}
				<button class="clear-btn" onclick={clearFilters}>Clear filters</button>
			{/if}
		</div>
	</div>

	<!-- Results -->
	{#if votes.length === 0}
		<p class="empty">No votes found. Try adjusting your search or filters.</p>
	{:else}
		<div class="votes-list">
			{#each votes as vote}
				<div class="vote-card">
					<div class="vote-card-body">
						<div class="vote-card-header">
							<span class="vote-date">{formatDate(vote.activity_date)}</span>
							{#if vote.decision_outcome}
								<span class="outcome-pill {isAdopted(vote.decision_outcome) ? 'outcome-adopted' : 'outcome-rejected'}">
									{outcomeLabel(vote.decision_outcome)}
								</span>
							{/if}
							{#if vote.doc_id}
								{@const key = vote.doc_id}
								<button
									class="expand-btn"
									onclick={() => toggleVoteItems(key, vote.doc_id, vote.activity_id)}
									aria-label={expanded.has(key) ? 'Collapse votes' : 'Expand votes'}
								>
									{expanded.has(key) ? '▲' : '▼'}
								</button>
							{/if}
						</div>

						<h2 class="vote-title">{voteTitle(vote)}</h2>

						{#if vote.summary}
							<p class="vote-summary">{vote.summary}</p>
						{/if}

						{#if vote.tags && vote.tags.length > 0}
							<div class="tags">
								{#each vote.tags.slice(0, 5) as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}

						{#if group && (vote.group_for != null || vote.group_against != null)}
							{@const total = (vote.group_for ?? 0) + (vote.group_against ?? 0) + (vote.group_abstain ?? 0)}
							<div class="group-breakdown">
								<span class="group-label">{group}</span>
								<div class="breakdown-bar">
									{#if total > 0}
										<div class="bar-for"     style="width: {(vote.group_for ?? 0) / total * 100}%"></div>
										<div class="bar-abstain" style="width: {(vote.group_abstain ?? 0) / total * 100}%"></div>
										<div class="bar-against" style="width: {(vote.group_against ?? 0) / total * 100}%"></div>
									{/if}
								</div>
								<span class="breakdown-counts">
									<span class="count-for">{vote.group_for ?? 0} for</span>
									·
									<span class="count-against">{vote.group_against ?? 0} against</span>
									·
									<span class="count-abstain">{vote.group_abstain ?? 0} abstain</span>
								</span>
							</div>
						{/if}
					</div>

					{#if vote.doc_id && expanded.has(vote.doc_id)}
						{@const key = vote.doc_id}
						<div class="subvotes-panel">
							{#if loadingVotes.has(key)}
								<p class="subvotes-empty">Loading…</p>
							{:else}
								{@const groups = groupCache.get(key) ?? []}
								{#if groups.length > 0}
									<div class="group-chart-wrap">
										<GroupBreakdownChart data={groups} />
									</div>
								{/if}
								{@const items = subvoteCache.get(key) ?? []}
								{#if items.length === 0}
									<p class="subvotes-empty">No votes available.</p>
								{:else}
									{#each items as item}
										<div class="subvote-row">
											<div class="subvote-body">
												<span class="subvote-label">{voteItemLabel(item)}</span>
												{#if item.decision_outcome}
													<span class="subvote-meta {isAdopted(item.decision_outcome) ? 'meta-adopted' : 'meta-rejected'}">
														{outcomeLabel(item.decision_outcome)}
													</span>
												{/if}
											</div>
											{#if item.votes_for != null}
												<span class="subvote-counts">
													<span class="count-for">{item.votes_for}</span>
													·
													<span class="count-against">{item.votes_against}</span>
													·
													<span class="count-abstain">{item.votes_abstain}</span>
												</span>
											{/if}
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
</main>

<style>
	main {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}

	/* Header */
	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}
	.meps-link {
		font-size: 13px;
		font-weight: 500;
		color: #6366f1;
		text-decoration: none;
		white-space: nowrap;
		padding-top: 4px;
	}
	.meps-link:hover { text-decoration: underline; }
	.page-header h1 {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
		color: #111827;
	}
	.page-subtitle {
		margin: 0;
		color: #6b7280;
		font-size: 0.95rem;
	}

	/* Filters */
	.filters {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.filter-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.filter-search {
		flex: 1;
		min-width: 200px;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		font-family: inherit;
		background: #fff;
	}
	.filter-search:focus {
		outline: none;
		border-color: #6b7280;
	}
	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.filter-group label {
		font-size: 0.8rem;
		color: #6b7280;
		white-space: nowrap;
	}
	.filter-group input,
	.filter-group select {
		padding: 0.4rem 0.6rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.85rem;
		font-family: inherit;
		background: #fff;
	}
	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: #6b7280;
	}
	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		color: #374151;
		cursor: pointer;
		white-space: nowrap;
	}
	.filter-toggle input {
		cursor: pointer;
		accent-color: #374151;
	}
	.clear-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.8rem;
		color: #9ca3af;
		padding: 0.3rem 0.5rem;
		border-radius: 4px;
		margin-left: auto;
	}
	.clear-btn:hover {
		background: #e5e7eb;
		color: #374151;
	}

	/* Empty state */
	.empty {
		color: #9ca3af;
		font-style: italic;
		text-align: center;
		padding: 3rem 0;
	}

	/* Vote list */
	.votes-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Vote card */
	.vote-card {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}
	.vote-card-body {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.vote-card-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
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
		margin-left: auto;
	}
	.expand-btn:hover {
		background: #e5e7eb;
		color: #6b7280;
	}

	/* Sub-votes panel */
	.subvotes-panel {
		border-top: 1px solid #e5e7eb;
		background: #fff;
		padding: 0.5rem 1.25rem 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.group-chart-wrap {
		padding: 0.5rem 0 0.25rem;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 0.25rem;
	}
	.subvotes-empty {
		font-size: 0.78rem;
		color: #9ca3af;
		font-style: italic;
		margin: 0;
		padding: 0.2rem 0;
	}
	.subvote-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.subvote-body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
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
	.meta-adopted  { color: #065f46; }
	.meta-rejected { color: #991b1b; }
	.subvote-counts {
		font-size: 0.72rem;
		color: #9ca3af;
		display: flex;
		gap: 0.25rem;
		align-items: center;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.vote-date {
		font-size: 0.78rem;
		color: #9ca3af;
	}
	.outcome-pill {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.outcome-adopted  { background: #d1fae5; color: #065f46; }
	.outcome-rejected { background: #fee2e2; color: #991b1b; }

	.vote-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: #111827;
		line-height: 1.4;
	}
	.vote-summary {
		margin: 0;
		font-size: 0.85rem;
		color: #374151;
		line-height: 1.5;
	}

	/* Tags */
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.tag {
		font-size: 0.72rem;
		padding: 0.15rem 0.5rem;
		background: #e5e7eb;
		color: #374151;
		border-radius: 9999px;
	}

	/* Group breakdown */
	.group-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e5e7eb;
	}
	.group-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
	}
	.breakdown-bar {
		display: flex;
		height: 6px;
		border-radius: 9999px;
		overflow: hidden;
		background: #e5e7eb;
	}
	.bar-for     { background: #6ee7b7; }
	.bar-abstain { background: #d1d5db; }
	.bar-against { background: #fca5a5; }
	.breakdown-counts {
		font-size: 0.72rem;
		color: #9ca3af;
		display: flex;
		gap: 0.3rem;
		align-items: center;
	}
	.count-for     { color: #065f46; }
	.count-against { color: #991b1b; }
</style>
