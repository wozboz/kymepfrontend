<script lang="ts">
	import { Chart, Svg, Bars } from 'layerchart';
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { stack } from 'd3-shape';
	import { max } from 'd3-array';

	type GroupRow = { group: string; for: number; against: number; abstain: number };
	const { data }: { data: GroupRow[] } = $props();

	const KEYS = ['for', 'abstain', 'against'];
	const COLORS: Record<string, string> = {
		for: '#22c55e',
		abstain: '#9ca3af',
		against: '#ef4444'
	};

	const CHART_PADDING = { top: 2, bottom: 2, left: 0, right: 4 };

	const stackedSeries = $derived(stack<GroupRow>().keys(KEYS as any)(data));
	const flatData = $derived(stackedSeries.flatMap((s: any[]) => [...s]));
	const groups = $derived(data.map((d: GroupRow) => d.group));
	const maxTotal = $derived(max(data, (d: GroupRow) => d.for + d.against + d.abstain) ?? 1);
	const chartHeight = $derived(data.length * 32 + 16);
	const rowHeight = $derived((chartHeight - CHART_PADDING.top - CHART_PADDING.bottom) / data.length);

	let tooltip = $state<{ x: number; y: number; row: GroupRow } | null>(null);

	function handlePointerMove(e: PointerEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const relY = e.clientY - rect.top - CHART_PADDING.top;
		const idx = Math.floor(relY / rowHeight);
		if (idx >= 0 && idx < data.length) {
			tooltip = { x: e.clientX, y: e.clientY, row: data[idx] };
		} else {
			tooltip = null;
		}
	}
</script>

<div class="group-chart">
	<!-- Party labels — one per row, aligned with scaleBand steps -->
	<div class="labels" style="padding-top: {CHART_PADDING.top}px">
		{#each data as row}
			<div class="label-row" style="height: {rowHeight}px">
				<span class="label-text">{row.group}</span>
			</div>
		{/each}
	</div>

	<!-- Bars -->
	<div
		class="bars"
		style="height: {chartHeight}px"
		onpointermove={handlePointerMove}
		onpointerleave={() => (tooltip = null)}
	>
		<Chart
			data={flatData}
			flatData={flatData}
			x={(d: any) => [d[0], d[1]]}
			y={(d: any) => d.data.group}
			xScale={scaleLinear()}
			yScale={scaleBand().padding(0.25)}
			xDomain={[0, maxTotal]}
			yDomain={groups}
			padding={CHART_PADDING}
		>
			<Svg>
				{#each stackedSeries as series}
					<Bars
						data={[...series]}
						fill={COLORS[series.key]}
						strokeWidth={0}
						radius={2}
					/>
				{/each}
			</Svg>
		</Chart>
	</div>
</div>

{#if tooltip}
	<div
		class="tooltip"
		style="left: {tooltip.x + 12}px; top: {tooltip.y + 12}px"
	>
		<div class="tooltip-group">{tooltip.row.group}</div>
		<div class="tooltip-row"><span class="dot" style="background:{COLORS.for}"></span> For: {tooltip.row.for}</div>
		<div class="tooltip-row"><span class="dot" style="background:{COLORS.abstain}"></span> Abstain: {tooltip.row.abstain}</div>
		<div class="tooltip-row"><span class="dot" style="background:{COLORS.against}"></span> Against: {tooltip.row.against}</div>
	</div>
{/if}

<style>
	.group-chart {
		display: flex;
		width: 100%;
		gap: 4px;
	}
	.labels {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}
	.label-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
	.label-text {
		font-size: 11px;
		color: #6b7280;
		white-space: nowrap;
		line-height: 1;
	}
	.bars {
		flex: 1;
		min-width: 0;
	}
	.tooltip {
		position: fixed;
		z-index: 100;
		background: #1f2937;
		color: #f9fafb;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 12px;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0,0,0,0.3);
		white-space: nowrap;
	}
	.tooltip-group {
		font-weight: 600;
		margin-bottom: 4px;
	}
	.tooltip-row {
		display: flex;
		align-items: center;
		gap: 5px;
		line-height: 1.6;
	}
	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
