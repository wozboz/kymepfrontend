<script lang="ts">
	import { page, navigating } from '$app/state';
</script>

<nav>
	<div class="nav-inner">
		<a href="/" class="brand">KnowYourMEP</a>
		<div class="links">
			<a href="/" class:active={page.url.pathname === '/'}>Vote Explorer</a>
			<a href="/meps" class:active={page.url.pathname.startsWith('/meps')}>MEPs</a>
		</div>
	</div>
	{#if navigating.type}
		<div class="progress-track"><div class="progress-bar"></div></div>
	{/if}
</nav>

<style>
	nav {
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	.progress-track {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		overflow: hidden;
	}
	.progress-bar {
		position: absolute;
		height: 100%;
		width: 45%;
		background: #6366f1;
		animation: slide 1s ease-in-out infinite;
	}
	@keyframes slide {
		0%   { left: -45%; }
		100% { left: 145%; }
	}
	.nav-inner {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1rem;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.brand {
		font-family: system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 700;
		color: #111827;
		text-decoration: none;
	}
	.brand:hover {
		color: #6366f1;
	}
	.links {
		display: flex;
		gap: 1.5rem;
	}
	.links a {
		font-family: system-ui, sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: #6b7280;
		text-decoration: none;
	}
	.links a:hover {
		color: #111827;
	}
	.links a.active {
		color: #6366f1;
		border-bottom: 2px solid #6366f1;
		padding-bottom: 2px;
	}
</style>
