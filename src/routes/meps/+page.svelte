<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const COUNTRY_FLAGS: Record<string, string> = {
		AUT: '🇦🇹', BEL: '🇧🇪', BGR: '🇧🇬', CYP: '🇨🇾', CZE: '🇨🇿',
		DEU: '🇩🇪', DNK: '🇩🇰', ESP: '🇪🇸', EST: '🇪🇪', FIN: '🇫🇮',
		FRA: '🇫🇷', GRC: '🇬🇷', HRV: '🇭🇷', HUN: '🇭🇺', IRL: '🇮🇪',
		ITA: '🇮🇹', LTU: '🇱🇹', LUX: '🇱🇺', LVA: '🇱🇻', MLT: '🇲🇹',
		NLD: '🇳🇱', POL: '🇵🇱', PRT: '🇵🇹', ROU: '🇷🇴', SVK: '🇸🇰',
		SVN: '🇸🇮', SWE: '🇸🇪',
	};

	const allGroups = $derived(
		[...new Set(data.meps.map((m: any) => m.political_group).filter(Boolean))].sort()
	);
	const allCountries = $derived(
		[...new Set(data.meps.map((m: any) => m.country).filter(Boolean))].sort()
	);

	let search = $state('');
	let filterGroup = $state('');
	let filterCountry = $state('');

	const filtered = $derived(() => {
		const q = search.toLowerCase().trim();
		return data.meps.filter((m: any) => {
			if (filterGroup && m.political_group !== filterGroup) return false;
			if (filterCountry && m.country !== filterCountry) return false;
			if (q && !m.label.toLowerCase().includes(q)) return false;
			return true;
		});
	});
</script>

<svelte:head>
	<title>MEPs — KnowYourMEP</title>
</svelte:head>

<main>
	<header>
		<h1>Members of the European Parliament</h1>
		<p class="subtitle">{data.meps.length} MEPs in the current term</p>
	</header>

	<div class="filters">
		<input
			class="search"
			type="search"
			placeholder="Search by name…"
			bind:value={search}
		/>
		<select bind:value={filterGroup}>
			<option value="">All groups</option>
			{#each allGroups as g}
				<option value={g}>{g}</option>
			{/each}
		</select>
		<select bind:value={filterCountry}>
			<option value="">All countries</option>
			{#each allCountries as c}
				<option value={c}>{COUNTRY_FLAGS[c] ?? ''} {c}</option>
			{/each}
		</select>
	</div>

	<div class="count">{filtered().length} result{filtered().length === 1 ? '' : 's'}</div>

	<ul class="mep-list">
		{#each filtered() as mep (mep.identifier)}
			<li>
				<a href="/meps/{mep.identifier}" class="mep-row">
					<span class="mep-name">{mep.label}</span>
					<span class="mep-meta">
						{#if mep.country}
							<span class="flag">{COUNTRY_FLAGS[mep.country] ?? mep.country}</span>
						{/if}
						{#if mep.political_group}
							<span class="group-badge">{mep.political_group}</span>
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 24px 16px 64px;
		font-family: system-ui, sans-serif;
	}

	header {
		margin-bottom: 24px;
	}

	h1 {
		font-size: 22px;
		font-weight: 700;
		color: #111;
		margin: 0 0 4px;
	}

	.subtitle {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
	}

	.filters {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}

	.search {
		flex: 1;
		min-width: 180px;
		padding: 7px 10px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
	}
	.search:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px #e0e7ff; }

	select {
		padding: 7px 10px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		background: white;
		color: #374151;
	}
	select:focus { outline: none; border-color: #6366f1; }

	.count {
		font-size: 12px;
		color: #9ca3af;
		margin-bottom: 8px;
	}

	.mep-list {
		list-style: none;
		padding: 0;
		margin: 0;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	li + li {
		border-top: 1px solid #f3f4f6;
	}

	.mep-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 14px;
		text-decoration: none;
		color: inherit;
		background: white;
		transition: background 0.1s;
	}
	.mep-row:hover { background: #f9fafb; }

	.mep-name {
		font-size: 14px;
		font-weight: 500;
		color: #1f2937;
	}

	.mep-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.flag {
		font-size: 16px;
	}

	.group-badge {
		font-size: 11px;
		font-weight: 600;
		color: #6b7280;
		background: #f3f4f6;
		padding: 2px 7px;
		border-radius: 999px;
	}
</style>
