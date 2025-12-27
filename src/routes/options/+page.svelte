<script>
	import { onMount } from 'svelte';
	import RuleRow from '../../components/RuleRow.svelte';
	import RuleModal from '../../components/RuleModal.svelte';

	let items = $state([]);
	let showModal = $state(false);
	let editingRule = $state(null); // null for new, rule object for edit

	async function getSyncedData() {
		const storedData = await browser.storage.sync.get('DLSorter');
		if (storedData.DLSorter === undefined) {
			await browser.storage.sync.set({ DLSorter: [] });
			return [];
		}
		return storedData.DLSorter;
	}

	onMount(async () => {
		items = await getSyncedData();
	});

	function openAddModal() {
		editingRule = null;
		showModal = true;
	}

	function openEditModal(index) {
		editingRule = { ...items[index] };
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingRule = null;
	}

	async function handleSaveRule(ruleData) {
		if (editingRule) {
			// Update existing rule
			const index = items.findIndex(r => r.id === editingRule.id);
			if (index !== -1) {
				items[index] = { ...ruleData, id: editingRule.id };
			}
		} else {
			// Add new rule
			const newRuleWithId = {
				...ruleData,
				id: items.length,
			};
			items = [...items, newRuleWithId];
		}

		await browser.storage.sync.set({ DLSorter: items });
		closeModal();
	}

	async function exportRules() {
		const jsonData = { DLSorter: items };
		const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
			type: 'application/json',
		});
		const url = URL.createObjectURL(blob);
		try {
			await browser.downloads.download({
				url: url,
				filename: 'DLSorter.json',
			});
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	async function importRules() {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.json';

		fileInput.onchange = async () => {
			try {
				const file = fileInput.files[0];
				if (!file) return;

				const text = await file.text();
				const jsonData = JSON.parse(text);

				if (!jsonData.DLSorter || !Array.isArray(jsonData.DLSorter)) {
					throw new Error('Invalid file format');
				}

				const rulesWithIds = jsonData.DLSorter.map((rule, index) => ({
					...rule,
					id: index,
				}));

				await browser.storage.sync.set({ DLSorter: rulesWithIds });
				items = rulesWithIds;
			} catch (error) {
				console.error('Error importing rules:', error);
				alert('Failed to import rules. Please check the file format.');
			}
		};

		fileInput.click();
	}

	function handleDragStart(e, index) {
		e.dataTransfer.setData('application/x-dlsorter-index', index);
		const row = e.target.closest('tr');
		row.classList.add('dragging');

		const dragImage = row.cloneNode(true);
		dragImage.style.width = row.offsetWidth + 'px';
		dragImage.style.position = 'absolute';
		dragImage.style.top = '-1000px';
		document.body.appendChild(dragImage);

		e.dataTransfer.setDragImage(dragImage, 0, 0);

		setTimeout(() => {
			document.body.removeChild(dragImage);
		}, 0);
	}

	function handleDragOver(e) {
		e.preventDefault();
		const row = e.target.closest('tr');
		if (row) {
			document
				.querySelectorAll('tr.drag-over')
				.forEach(el => el.classList.remove('drag-over'));
			row.classList.add('drag-over');
		}
	}

	async function handleDrop(e, dropIndex) {
		e.preventDefault();
		const dragIndex = parseInt(e.dataTransfer.getData('application/x-dlsorter-index'));
		if (dragIndex !== dropIndex) {
			const newItems = [...items];
			const [removed] = newItems.splice(dragIndex, 1);
			newItems.splice(dropIndex, 0, removed);
			items = newItems;
			await browser.storage.sync.set({ DLSorter: items });
		}
		document.querySelectorAll('tr.drag-over').forEach(el => el.classList.remove('drag-over'));
		document.querySelectorAll('tr.dragging').forEach(el => el.classList.remove('dragging'));
	}

	function handleDragEnd(e) {
		document.querySelectorAll('tr.drag-over').forEach(el => el.classList.remove('drag-over'));
		document.querySelectorAll('tr.dragging').forEach(el => el.classList.remove('dragging'));
	}

	async function deleteRule(index) {
		items = items.filter((_, i) => i !== index);
		await browser.storage.sync.set({ DLSorter: items });
	}

	async function saveRule() {
		await browser.storage.sync.set({ DLSorter: items });
	}
</script>

<div class="flex-auto overflow-y-auto p-4">
	<table class="table table-zebra table-pin-cols w-4/5 bg-base-300 mx-auto">
		<thead class="sticky top-0 z-10">
			<tr>
				<th class="bg-primary rounded-tl-xl"></th>
				<th class="bg-primary text-primary-content text-xl text-center"
					>MartynasXS Download Sorter</th
				>
				<th class="bg-primary rounded-tr-xl w-24">
					<button class="btn btn-sm" onclick={importRules}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							><g fill="none"
								><path
									fill="currentColor"
									d="m12 14l-.707.707l.707.707l.707-.707zm1-9a1 1 0 1 0-2 0zM6.293 9.707l5 5l1.414-1.414l-5-5zm6.414 5l5-5l-1.414-1.414l-5 5zM13 14V5h-2v9z"
								/><path
									stroke="currentColor"
									stroke-width="2"
									d="M5 16v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1"
								/></g
							></svg
						>
						<span>Import</span>
					</button>
					<button class="btn btn-sm" onclick={exportRules}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							><!-- Icon from Lets Icons by Leonid Tsvetkov - https://creativecommons.org/licenses/by/4.0/ --><g
								fill="none"
								><path
									fill="currentColor"
									d="m12 5l-.707-.707l.707-.707l.707.707zm1 9a1 1 0 1 1-2 0zM6.293 9.293l5-5l1.414 1.414l-5 5zm6.414-5l5 5l-1.414 1.414l-5-5zM13 5v9h-2V5z"
								/><path
									stroke="currentColor"
									stroke-width="2"
									d="M5 16v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1"
								/></g
							></svg
						>
						<span>Export</span>
					</button>
					<button class="btn btn-sm" onclick={openAddModal}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" /></svg
						>
						<span>New rule</span>
					</button>
				</th>
			</tr>
		</thead>
		<tbody id="rules">
			{#each items as ri, index}
				<RuleRow
					rule={ri}
					{index}
					onDelete={deleteRule}
					onEdit={openEditModal}
					onSave={saveRule}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					onDragEnd={handleDragEnd}
				/>
			{:else}
				<tr>
					<td colspan="3">
						<div class="flex justify-center items-center h-[400px]">
							<span class="text-gray-500">No rules found</span>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<RuleModal isOpen={showModal} rule={editingRule} onClose={closeModal} onSave={handleSaveRule} />

<style>
	thead::before {
		content: '';
		position: absolute;
		top: -2rem;
		left: 0;
		width: 100%;
		height: 2rem;
		background-color: var(--color-base-100);
		z-index: -6;
	}
	tr.dragging {
		cursor: grabbing;
		opacity: 0.5;
	}

	tr.drag-over {
		border-top: 2px solid var(--color-primary);
	}
</style>
