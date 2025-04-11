// Define types for our data structures
interface MetricsRecord {
  id: number | string;
  timestamp: string;
  count: number;
  [key: string]: any; // Allow for additional properties
}

interface MetricsData {
  [key: string]: MetricsRecord[]; // Key is metric name (followers, stars, etc.)
}

interface LoadOptions {
  useCache?: boolean;
  noCache?: boolean;
  sortByTimestamp?: boolean;
  limit?: number;
  latest?: boolean;
  showChange?: boolean;
  backupPath?: string;
  isBackupAttempt?: boolean;
}

// Cache for loaded data to reduce redundant fetches
const dataCache: Map<string, MetricsData> = new Map();

// Function to load metrics with better error handling and caching
async function loadMetrics(filePath: string, tableBodyId: string, options: LoadOptions = {}): Promise<void> {
    try {
        // Check cache first
        if (dataCache.has(filePath) && options.useCache !== false) {
            console.log(`Using cached data for: ${filePath}`);
            renderTableData(dataCache.get(filePath)!, tableBodyId, options);
            return;
        }
        
        console.log(`Fetching data from: ${filePath}`);
        const response = await fetch(filePath, { 
            cache: options.noCache ? 'no-cache' : 'default' 
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MetricsData = await response.json();
        
        // Cache the result
        dataCache.set(filePath, data);
        
        // Render the data
        renderTableData(data, tableBodyId, options);
    } catch (error) {
        console.error('Error loading data:', error);
        const tableBody = document.getElementById(tableBodyId);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="3">Error loading data: ${error instanceof Error ? error.message : String(error)}</td></tr>`;
        }
        
        // Try to load from backup location if specified
        if (options.backupPath && !options.isBackupAttempt) {
            console.log(`Attempting to load from backup: ${options.backupPath}`);
            loadMetrics(options.backupPath, tableBodyId, { ...options, isBackupAttempt: true });
        }
    }
}

// Separate rendering function for better separation of concerns
function renderTableData(data: MetricsData, tableBodyId: string, options: LoadOptions = {}): void {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error(`Table body element not found: ${tableBodyId}`);
        return;
    }

    // Clear previous table data
    tableBody.innerHTML = "";

    // Extract the first key from the JSON object (e.g., "followers", "forks", etc.)
    const metricKey = Object.keys(data)[0]; 
    if (!metricKey || !Array.isArray(data[metricKey])) {
        throw new Error("Unexpected data structure.");
    }

    // Get data records, sorted by date if requested
    let records: MetricsRecord[] = data[metricKey];
    
    if (options.sortByTimestamp) {
        records = [...records].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }
    
    // Apply limit if specified
    if (options.limit && records.length > options.limit) {
        records = options.latest 
            ? records.slice(-options.limit) 
            : records.slice(0, options.limit);
    }

    // Process each record
    records.forEach((record, index) => {
        const row = document.createElement('tr');

        // Extract and format data
        const id = record.id || 'N/A';
        const timestamp = record.timestamp 
            ? new Date(record.timestamp).toLocaleString() 
            : 'N/A';
        const count = record.count !== undefined 
            ? record.count.toLocaleString() 
            : 'N/A';
            
        // Calculate change if there's a previous record
        let changeCell = '';
        if (index < records.length - 1 && options.showChange) {
            const prevCount = records[index + 1].count;
            if (prevCount !== undefined && record.count !== undefined) {
                const change = record.count - prevCount;
                const changePercent = prevCount !== 0 
                    ? (change / prevCount * 100).toFixed(2) 
                    : 'N/A';
                    
                const changeClass = change > 0 
                    ? 'positive-change' 
                    : (change < 0 ? 'negative-change' : '');
                    
                changeCell = `<td class="${changeClass}">${change >= 0 ? '+' : ''}${change.toLocaleString()} (${changePercent}%)</td>`;
            }
        }

        // Populate row
        row.innerHTML = `
            <td>${id}</td>
            <td>${timestamp}</td>
            <td>${count}</td>
            ${options.showChange ? changeCell : ''}
        `;
        tableBody.appendChild(row);
    });
}

// Function to refresh data
function refreshAllData(): void {
    console.log('Refreshing all data...');
    loadMetrics('public/data/x_metrics.json', 'xMetricsBody', { 
        noCache: true, 
        sortByTimestamp: true, 
        limit: 10,
        latest: true,
        showChange: true 
    });
    loadMetrics('public/data/telegram_metrics.json', 'telegramMetricsBody', { 
        noCache: true, 
        sortByTimestamp: true, 
        limit: 10,
        latest: true,
        showChange: true 
    });
    loadMetrics('public/data/token_holders.json', 'tokenHoldersBody', { 
        noCache: true, 
        sortByTimestamp: true,
        limit: 10,
        latest: true,
        showChange: true 
    });
    loadMetrics('public/data/github_stars.json', 'githubStarBody', { 
        noCache: true, 
        sortByTimestamp: true,
        limit: 10,
        latest: true,
        showChange: true 
    });
    loadMetrics('public/data/github_forks.json', 'githubForkBody', { 
        noCache: true, 
        sortByTimestamp: true,
        limit: 10,
        latest: true,
        showChange: true 
    });
}

// Load different datasets
loadMetrics('public/data/x_metrics.json', 'xMetricsBody', { 
    sortByTimestamp: true, 
    limit: 10,
    latest: true,
    showChange: true 
});
loadMetrics('public/data/telegram_metrics.json', 'telegramMetricsBody', { 
    sortByTimestamp: true,
    limit: 10,
    latest: true,
    showChange: true  
});
loadMetrics('public/data/token_holders.json', 'tokenHoldersBody', { 
    sortByTimestamp: true,
    limit: 10,
    latest: true,
    showChange: true 
});
loadMetrics('public/data/github_stars.json', 'githubStarBody', { 
    sortByTimestamp: true,
    limit: 10,
    latest: true,
    showChange: true 
});
loadMetrics('public/data/github_forks.json', 'githubForkBody', { 
    sortByTimestamp: true,
    limit: 10,
    latest: true,
    showChange: true 
});

// Add refresh button event listener if it exists
document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshAllData);
    }
    
    // Auto-refresh every 30 minutes if configured
    if ((window as any).AUTO_REFRESH_ENABLED) {
        setInterval(refreshAllData, 30 * 60 * 1000);
    }
});
