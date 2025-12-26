// State Management
let currentData = [];

// Date formatting utilities
const dateFormatters = {
    "${YYYY}": (date) => date.getFullYear(),
    "${YY}": (date) => date.getFullYear().toString().slice(-2),
    "${MM}": (date) => (date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1),
    "${DD}": (date) => (date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()),
    "${h}": (date) => date.getHours(),
    "${m}": (date) => date.getMinutes(),
    "${s}": (date) => date.getSeconds(),
    "${ms}": (date) => date.getMilliseconds()
};

// Rule matching functions
function findUrlMatch(download) {
    if (!currentData) return null;
    return currentData.find((item) => {
        if (!item.enabled) return false; // Check if rule is enabled
        // Must have a non-empty URL pattern
        const urlPattern = item.pattern?.trim();
        if (!urlPattern || urlPattern === "") return false;
        try {
            const re = new RegExp(urlPattern, "i");
            return re.test(download.referrer) || re.test(download.url);
        } catch (e) {
            console.error("DLSorter: Invalid URL pattern", urlPattern, e);
            return false;
        }
    });
}

// Determine which URL (referrer or url) matched the pattern
function getMatchedUrl(pattern, download) {
    if (!pattern) return download.url;
    const re = new RegExp(pattern, "i");
    // Prefer referrer if it matches, otherwise use url (matching old behavior)
    return re.test(download.referrer) ? download.referrer : download.url;
}

function findFileMatch(filename) {
    if (!currentData) return null;
    console.log("DLSorter: findFileMatch called for", filename, "with", currentData.length, "rules");
    return currentData.find((item) => {
        if (!item.enabled) {
            console.log("DLSorter: Rule disabled", item);
            return false;
        }

        // Only match if URL pattern is empty or not set (file-only rules)
        // Check for empty string, null, undefined, or whitespace-only
        const urlPattern = (item.pattern || "").trim();
        if (urlPattern.length > 0) {
            console.log("DLSorter: Skipping rule - has URL pattern", {
                urlPattern,
                filePattern: item.filePattern
            });
            return false;
        }

        // Must have a file pattern
        const filePattern = item.filePattern?.trim();
        if (!filePattern || filePattern === "") {
            console.log("DLSorter: Skipping rule - no file pattern", item);
            return false;
        }

        try {
            const re = new RegExp(filePattern, "i");
            const matches = re.test(filename);
            if (matches) {
                console.log("DLSorter: File pattern matched", {
                    filePattern,
                    filename,
                    rule: item
                });
            } else {
                console.log("DLSorter: File pattern did not match", {
                    filePattern,
                    filename
                });
            }
            return matches;
        } catch (e) {
            console.error("DLSorter: Invalid file pattern", filePattern, e);
            return false;
        }
    });
}

// Path processing functions
function extractGroups(pattern, text) {
    if (!pattern || !text) return [];
    try {
        const regex = new RegExp(pattern, "i");
        const matches = regex.exec(text);
        return matches ? matches.slice(1) : [];
    } catch (e) {
        console.error("DLSorter: Error extracting groups", e);
        return [];
    }
}

function processPath(template, groups, filename) {
    let result = template;

    // Replace date placeholders
    const date = new Date();
    Object.entries(dateFormatters).forEach(([key, formatter]) => {
        result = result.replaceAll(key, formatter(date));
    });

    // Replace capture group placeholders
    groups.forEach((group, index) => {
        result = result.replaceAll(`\$${index + 1}`, group);
    });

    // Handle final path formatting
    return result.endsWith("/") ? `${result}${filename}` : result;
}

// Extract filename from path (cross-platform)
function extractFilename(filepath) {
    if (filepath.indexOf("\\") !== -1) {
        return filepath.split("\\").pop();
    } else {
        return filepath.split("/").pop();
    }
}

// Show toast notification
async function showToastNotification(filename, targetPath) {
    try {
        const notificationId = await browser.notifications.create({
            type: "basic",
            iconUrl: browser.runtime.getURL("favicon.png"),
            title: "Download Redirected",
            message: `${filename}\n→ ${targetPath}`
        });

        // Auto-close notification after 3 seconds
        setTimeout(() => {
            browser.notifications.clear(notificationId);
        }, 3000);
    } catch (error) {
        console.error("DLSorter: Error showing notification", error);
    }
}

// Download handling
async function handleDownload(download) {
    if (download.byExtensionId) return;
    if (!currentData || currentData.length === 0) {
        console.log("DLSorter: No rules configured");
        return;
    }

    const filename = extractFilename(download.filename);
    console.log("DLSorter: Processing download", {
        url: download.url,
        filename,
        fullPath: download.filename,
        referrer: download.referrer
    });

    const urlMatch = findUrlMatch(download);
    if (urlMatch) {
        console.log("DLSorter: URL match found", urlMatch);
    }

    // Check if urlMatch has filePattern that needs to match
    let filePatternMatch = null;
    if (urlMatch && urlMatch.filePattern && urlMatch.filePattern !== "") {
        filePatternMatch = filename.match(new RegExp(urlMatch.filePattern, "i"));
        // If urlMatch has filePattern but it doesn't match, don't process
        if (!filePatternMatch) return;
    }

    // Only look for fileMatch if there's no urlMatch
    let fileMatch = null;
    if (!urlMatch) {
        console.log("DLSorter: No URL match, checking file patterns for", filename);
        fileMatch = findFileMatch(filename);
        if (fileMatch) {
            console.log("DLSorter: File match found", fileMatch);
        } else {
            console.log("DLSorter: No file match found for filename", filename);
            console.log("DLSorter: Available rules for file matching", currentData
                .filter(r => r.enabled)
                .map(r => ({
                    pattern: r.pattern,
                    patternType: typeof r.pattern,
                    patternLength: r.pattern?.length,
                    filePattern: r.filePattern,
                    enabled: r.enabled
                })));
        }
    }

    // If no matches, don't process
    if (!urlMatch && !fileMatch) {
        console.log("DLSorter: No matching rule found");
        return;
    }

    console.log("DLSorter: Match found", { urlMatch: !!urlMatch, fileMatch: !!fileMatch });

    // Cancel the original download
    await browser.downloads.cancel(download.id);
    await browser.downloads.erase({
        limit: 1,
        orderBy: ["-startTime"]
    });

    // Process the path and groups
    let groups = [];
    let targetPath;

    if (urlMatch) {
        // Extract groups from the URL that matched (referrer or url)
        const matchedUrl = getMatchedUrl(urlMatch.pattern, download);
        const urlGroups = extractGroups(urlMatch.pattern, matchedUrl);
        groups = [...urlGroups];

        // If urlMatch has filePattern, extract groups from filename too
        if (urlMatch.filePattern && urlMatch.filePattern !== "" && filePatternMatch) {
            const fileGroups = extractGroups(urlMatch.filePattern, filename);
            groups = [...groups, ...fileGroups];
        }

        targetPath = processPath(urlMatch.dir, groups, filename);
    } else {
        // Use fileMatch rule
        groups = extractGroups(fileMatch.filePattern, filename);
        targetPath = processPath(fileMatch.dir, groups, filename);
    }

    console.log("DLSorter: Starting download with path", targetPath);

    // Start the new download
    try {
        await browser.downloads.download({
            url: download.url,
            filename: targetPath
        });
        console.log("DLSorter: Download started successfully");

        // Show toast notification
        await showToastNotification(filename, targetPath);
    } catch (error) {
        console.error("DLSorter: Error starting download", error);
    }
}

// Event Listeners
browser.storage.sync.get("DLSorter").then((result) => {
    currentData = result.DLSorter || [];
    console.log("DLSorter rules loaded:", currentData.length);
});

browser.storage.sync.onChanged.addListener((changes) => {
    if (changes.DLSorter) {
        currentData = changes.DLSorter.newValue || [];
        console.log("DLSorter rules updated:", currentData.length);
    }
});

browser.downloads.onCreated.addListener(handleDownload);

browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});
