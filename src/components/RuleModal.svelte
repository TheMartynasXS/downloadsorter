<script>
	let {
		isOpen = false,
		rule = null, // null for new rule, rule object for edit
		onClose = () => {},
		onSave = () => {},
	} = $props();

	// Form state
	let formRule = $state({
		pattern: '',
		filePattern: '',
		dir: '',
		enabled: true,
	});

	// Test inputs
	let testUrl = $state('');

	// Extract filename from URL
	function extractFilenameFromUrl(url) {
		if (!url) return '';
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;
			let filename = '';
			if (pathname.indexOf('\\') !== -1) {
				filename = pathname.split('\\').pop() || '';
			} else {
				filename = pathname.split('/').pop() || '';
			}
			filename = filename.split('?')[0].split('#')[0];
			return filename || '';
		} catch (e) {
			const parts = url.split('/');
			const lastPart = parts[parts.length - 1] || '';
			return lastPart.split('?')[0].split('#')[0] || '';
		}
	}

	let testFilename = $derived(extractFilenameFromUrl(testUrl));

	// Date formatting utilities
	const dateFormatters = {
		'${YYYY}': date => date.getFullYear(),
		'${YY}': date => date.getFullYear().toString().slice(-2),
		'${MM}': date =>
			date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1,
		'${DD}': date => (date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()),
		'${h}': date => date.getHours(),
		'${m}': date => date.getMinutes(),
		'${s}': date => date.getSeconds(),
		'${ms}': date => date.getMilliseconds(),
	};

	// Extract capture groups from pattern
	function extractGroups(pattern, text) {
		if (!pattern || !text) return [];
		try {
			const regex = new RegExp(pattern, 'i');
			const matches = regex.exec(text);
			return matches ? matches.slice(1) : [];
		} catch (e) {
			return [];
		}
	}

	// Browser-compatible path joining
	function joinPath(...parts) {
		return parts
			.filter(part => part && part !== '')
			.join('/')
			.replace(/\/+/g, '/')
			.replace(/\/$/, '');
	}

	// Calculate preview result path
	function calculatePreview() {
		if (!formRule.dir) return '';

		let groups = [];
		let result = formRule.dir;

		if (formRule.pattern && testUrl) {
			groups = extractGroups(formRule.pattern, testUrl);
			if (formRule.filePattern && testFilename) {
				groups = [...groups, ...extractGroups(formRule.filePattern, testFilename)];
			}
		} else if (formRule.filePattern && testFilename) {
			groups = extractGroups(formRule.filePattern, testFilename);
		}

		const date = new Date();
		Object.entries(dateFormatters).forEach(([key, formatter]) => {
			result = result.replaceAll(key, formatter(date));
		});

		groups.forEach((group, index) => {
			result = result.replaceAll(`$${index + 1}`, group);
		});

		const filename = testFilename || 'example.txt';
		return result.endsWith('/') ? `${result}${filename}` : result;
	}

	let previewResult = $derived(calculatePreview());

	// Watch for rule changes (when editing)
	$effect(() => {
		if (rule) {
			formRule = {
				pattern: rule.pattern || '',
				filePattern: rule.filePattern || '',
				dir: rule.dir || '',
				enabled: rule.enabled !== undefined ? rule.enabled : true,
			};
		} else {
			formRule = {
				pattern: '',
				filePattern: '',
				dir: '',
				enabled: true,
			};
		}
		testUrl = '';
	});

	function handleClose() {
		onClose();
	}

	function handleSubmit() {
		if (!formRule.dir) {
			alert('Download path is required');
			return;
		}
		onSave(formRule);
		handleClose();
	}

	let isEditMode = $derived(rule !== null);
	let modalTitle = $derived(isEditMode ? 'Editing Rule' : 'Creating New Rule');
	let submitButtonText = $derived(isEditMode ? 'Save Rule' : 'Add Rule');
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-6xl p-0">
			<div class="flex h-[80vh]">
				<!-- Main Form Section -->
				<div class="flex-1 p-6 overflow-y-auto">
					<h3 class="text-lg font-bold mb-4">{modalTitle}</h3>

					<form
						onsubmit={e => {
							e.preventDefault();
							handleSubmit();
						}}
					>
						<div class="grid gap-4">
							<!-- URL Pattern -->
							<label class="form-control">
								<span class="label">
									<span class="label-text font-semibold">Url Pattern</span>
								</span>
								<input
									type="text"
									placeholder="\.site\.com"
									class="input input-bordered input-sm w-full"
									bind:value={formRule.pattern}
								/>
							</label>

							<!-- File Pattern -->
							<label class="form-control">
								<span class="label">
									<span class="label-text font-semibold">File Pattern</span>
								</span>
								<input
									type="text"
									placeholder="\.json$"
									class="input input-bordered input-sm w-full"
									bind:value={formRule.filePattern}
								/>
							</label>

							<!-- Download Path -->
							<label class="form-control">
								<span class="label">
									<span class="label-text font-semibold">Download Path</span>
								</span>
								<input
									type="text"
									placeholder="folder/"
									class="input input-bordered input-sm w-full"
									bind:value={formRule.dir}
									required
								/>
							</label>

							<!-- Enabled Toggle -->
							<label class="form-control">
								<span class="label">
									<span class="label-text font-semibold">Enabled</span>
								</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={formRule.enabled}
								/>
							</label>

							<!-- Divider -->
							<div class="divider">Test & Preview</div>

							<!-- Test URL -->
							<label class="form-control">
								<span class="label">
									<span class="label-text font-semibold">Test URL</span>
									<span class="label-text-alt"
										>Enter a URL to test the pattern</span
									>
								</span>
								<input
									type="text"
									placeholder="https://example.com/file.json"
									class="input input-bordered input-sm w-full"
									bind:value={testUrl}
								/>
							</label>

							<!-- Test Filename (extracted from URL) -->
							<div class="form-control">
								<span class="label">
									<span class="label-text font-semibold">Extracted Filename</span>
									<span class="label-text-alt"
										>Automatically extracted from the test URL</span
									>
								</span>
								<div
									class="input input-bordered input-sm w-full bg-base-200 text-base-content"
								>
									{testFilename
										? testFilename
										: 'Enter a URL above to see the extracted filename'}
								</div>
							</div>

							<!-- Preview Result -->
							<div class="form-control">
								<span class="label">
									<span class="label-text font-semibold">Result Path Preview</span
									>
									<span class="label-text-alt"
										>This is where the file would be saved</span
									>
								</span>
								<div
									class="input input-bordered input-sm w-full bg-base-200 text-base-content"
								>
									{previewResult
										? joinPath('{Downloads}', previewResult)
										: 'Enter patterns and test values to see preview'}
								</div>
							</div>
						</div>

						<!-- Modal Actions -->
						<div class="modal-action">
							<button type="button" class="btn btn-ghost" onclick={handleClose}>
								Cancel
							</button>
							<button type="submit" class="btn btn-primary">{submitButtonText}</button
							>
						</div>
					</form>
				</div>

				<!-- Sidebar with Explanations -->
				<div class="w-80 bg-base-200 p-6 overflow-y-auto border-l border-base-300">
					<h4 class="text-md font-bold mb-4">Help & Examples</h4>

					<!-- Date Formatters Section -->
					<div class="mb-6">
						<h5 class="font-semibold mb-2 text-sm">Date Formatters</h5>
						<p class="text-xs text-base-content/70 mb-3">
							Use these placeholders in your Download Path to insert date/time values:
						</p>
						<div class="space-y-2 text-xs">
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${YYYY}'}</code>
								<span class="text-base-content/70"> - Full year (e.g., 2024)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${YY}'}</code>
								<span class="text-base-content/70"> - 2-digit year (e.g., 24)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${MM}'}</code>
								<span class="text-base-content/70"> - Month (01-12)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${DD}'}</code>
								<span class="text-base-content/70"> - Day (01-31)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${h}'}</code>
								<span class="text-base-content/70"> - Hour (0-23)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${m}'}</code>
								<span class="text-base-content/70"> - Minute (0-59)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${s}'}</code>
								<span class="text-base-content/70"> - Second (0-59)</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">{'${ms}'}</code>
								<span class="text-base-content/70"> - Milliseconds</span>
							</div>
						</div>
						<div class="mt-3 p-2 bg-info/10 rounded text-xs">
							<strong>Example:</strong> <code>{'downloads/${YYYY}/${MM}/'}</code> →
							<code>downloads/2024/12/</code>
						</div>
					</div>

					<!-- Capture Groups Section -->
					<div class="mb-6">
						<h5 class="font-semibold mb-2 text-sm">Capture Groups</h5>
						<p class="text-xs text-base-content/70 mb-3">
							Use parentheses <code>()</code> in your patterns to capture parts of the
							URL or filename, then reference them with <code>$1</code>,
							<code>$2</code>, etc. in your Download Path.
						</p>
						<div class="space-y-2 text-xs mb-3">
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">$1</code>
								<span class="text-base-content/70"> - First capture group</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">$2</code>
								<span class="text-base-content/70"> - Second capture group</span>
							</div>
							<div class="bg-base-100 p-2 rounded">
								<code class="text-primary">$3</code>
								<span class="text-base-content/70">
									- Third capture group, etc.</span
								>
							</div>
						</div>
						<div class="space-y-2 text-xs">
							<div class="p-2 bg-base-100 rounded">
								<strong>Example 1:</strong>
								<div class="mt-1">
									<div>
										URL Pattern: <code class="text-primary"
											>(curseforge|modrinth)\.com/(.*)</code
										>
									</div>
									<div>
										Download Path: <code class="text-success"
											>minecraft/$2/</code
										>
									</div>
									<div class="text-base-content/70 mt-1">
										URL: <code>curseforge.com/mc-mods/example</code><br />
										Result: <code>minecraft/mc-mods/example/</code>
									</div>
								</div>
							</div>
							<div class="p-2 bg-base-100 rounded mt-2">
								<strong>Example 2:</strong>
								<div class="mt-1">
									<div>
										File Pattern: <code class="text-primary"
											>(.+)\.(json|txt)$</code
										>
									</div>
									<div>
										Download Path: <code class="text-success">files/$1/$2/</code
										>
									</div>
									<div class="text-base-content/70 mt-1">
										Filename: <code>data.json</code><br />
										Result: <code>files/data/json/</code>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Path Formatting Section -->
					<div class="mb-6">
						<h5 class="font-semibold mb-2 text-sm">Path Formatting</h5>
						<div class="p-3 bg-warning/10 rounded text-xs">
							<strong class="text-warning">⚠️ Important:</strong>
							<p class="mt-2 text-base-content/80">
								The Download Path must end with a trailing slash <code>/</code> to be
								treated as a folder. Without it, the path will be treated as a filename.
							</p>
							<div class="mt-3 space-y-2">
								<div class="bg-base-100 p-2 rounded">
									<strong>✅ Correct:</strong>
									<code class="block mt-1 text-success">folder/subfolder/</code>
									<span class="text-base-content/70"
										>→ Creates folder structure</span
									>
								</div>
								<div class="bg-base-100 p-2 rounded">
									<strong>❌ Incorrect:</strong>
									<code class="block mt-1 text-error">folder/subfolder</code>
									<span class="text-base-content/70">→ Treated as filename</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Pattern Tips -->
					<div>
						<h5 class="font-semibold mb-2 text-sm">Pattern Tips</h5>
						<ul class="text-xs space-y-1 text-base-content/70">
							<li>• Patterns use JavaScript regular expressions</li>
							<li>• Use <code>\.</code> to match a literal dot</li>
							<li>• Use <code>$</code> to match end of string</li>
							<li>• Use <code>^</code> to match start of string</li>
							<li>• Patterns are case-insensitive</li>
							<li>• Leave empty to match any URL/filename</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div
			class="modal-backdrop"
			onclick={handleClose}
			onkeydown={e => e.key === 'Escape' && handleClose()}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		></div>
	</div>
{/if}
