<script>
	export let rule;
	export let index;
	export let onDelete;
	export let onEdit;
	export let onSave;
	export let onDragStart;
	export let onDragOver;
	export let onDrop;
	export let onDragEnd;
</script>

<tr ondragend={onDragEnd}>
	<td
		class="w-18 drag-handle"
		draggable="true"
		ondragstart={e => onDragStart(e, index)}
		ondragover={onDragOver}
		ondrop={e => onDrop(e, index)}
	>
		<div class="grid place-items-center">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M9 20q-.825 0-1.412-.587T7 18t.588-1.412T9 16t1.413.588T11 18t-.587 1.413T9 20m6 0q-.825 0-1.412-.587T13 18t.588-1.412T15 16t1.413.588T17 18t-.587 1.413T15 20m-6-6q-.825 0-1.412-.587T7 12t.588-1.412T9 10t1.413.588T11 12t-.587 1.413T9 14m6 0q-.825 0-1.412-.587T13 12t.588-1.412T15 10t1.413.588T17 12t-.587 1.413T15 14M9 8q-.825 0-1.412-.587T7 6t.588-1.412T9 4t1.413.588T11 6t-.587 1.413T9 8m6 0q-.825 0-1.412-.587T13 6t.588-1.412T15 4t1.413.588T17 6t-.587 1.413T15 8"
				/>
			</svg>
		</div>
	</td>
	<td colspan="2">
		<div class="flex flex-col gap-2 py-2">
			<label class="input input-sm w-auto">
				<span class="label">Url Pattern</span>
				<input
					type="text"
					placeholder="\.site\.com"
					bind:value={rule.pattern}
					onchange={onSave}
				/>
			</label>
			<label class="input input-sm w-auto">
				<span class="label">File Pattern</span>
				<input
					type="text"
					placeholder="\.json$"
					bind:value={rule.filePattern}
					onchange={onSave}
				/>
			</label>
			<div class="flex gap-2 items-end">
				<label class="input input-sm w-auto flex-1">
					<span class="label">Download path</span>
					<input
						type="text"
						placeholder="folder/"
						bind:value={rule.dir}
						onchange={onSave}
					/>
				</label>

				<label class="label cursor-pointer" style="margin-block: auto;">
					<input
						type="checkbox"
						bind:checked={rule.enabled}
						class="toggle toggle-sm border-error bg-error-content checked:border-success checked:bg-success-content checked:text-success"
						onchange={onSave}
					/>
					<span class="label-text ml-2 w-16 text-left"
						>{rule.enabled ? 'enabled' : 'disabled'}</span
					>
				</label>
				<button
					class="btn btn-sm btn-ghost"
					onclick={() => onEdit(index)}
					title="Edit rule"
					aria-label="Edit rule"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
				</button>
				<button
					class="btn btn-sm btn-error"
					onclick={() => onDelete(index)}
					title="Delete rule"
					aria-label="Delete rule"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 6h18" />
						<path
							d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
						/>
					</svg>
				</button>
			</div>
		</div>
	</td>
</tr>

<style>
	.drag-handle {
		cursor: grab;
	}
	.drag-handle:active {
		cursor: grabbing;
	}
	:global(tr.dragging) {
		cursor: grabbing;
		opacity: 0.5;
	}
	:global(tr.drag-over) {
		border-top: 2px solid var(--color-primary);
	}
</style>
