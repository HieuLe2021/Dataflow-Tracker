import { ACCESS_TOKEN_URL } from '../constants';
import type { Dataflow, DataverseResponse, RefreshHistoryEntry, FetchDataflowsResult } from '../types';

/**
 * Fetches a plain text JWT access token from a Power Automate flow.
 * @returns A promise that resolves to the access token string.
 */
export const fetchAccessToken = async (): Promise<string> => {
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // Power Automate manual triggers expect a body, even if empty.
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch access token: ${response.status} ${response.statusText}. Details: ${errorText}`);
  }

  // As per instructions, the token is plain text, not JSON.
  const token = await response.text();
  if (!token) {
    throw new Error('Received an empty access token.');
  }
  return token;
};

/**
 * Normalizes a status string, returning 'Unknown' for invalid values.
 * @param status The raw status string.
 * @returns A clean status string.
 */
const getDisplayStatus = (status: string | null | undefined): string => {
    if (!status || !status.trim() || status.trim().toLowerCase() === 'null') {
        return 'Unknown';
    }
    return status;
};


/**
 * Fetches a page of dataflows from the Dataverse API.
 * @param token The JWT access token for authorization.
 * @param url The specific Dataverse API URL to fetch (for pagination).
 * @returns A promise that resolves to an object containing dataflows, the next page link, and the total count.
 */
export const fetchDataflows = async (token: string, url: string): Promise<FetchDataflowsResult> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Accept': 'application/json',
      'Prefer': 'odata.include-annotations="*"', // To get formatted values
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch dataflows: ${response.status} ${response.statusText}. Details: ${errorText}`);
  }

  const data: DataverseResponse = await response.json();
  
  // Parse refresh history to extract the latest status and a summary
  const processedDataflows = data.value.map(flow => {
    let lastRefreshStatus: string | undefined = undefined;
    let lastRefreshDate: string | undefined = undefined;
    let refreshHistorySummary: string[] | undefined = undefined;

    if (flow.msdyn_refreshhistory) {
        try {
            let historyData = JSON.parse(flow.msdyn_refreshhistory);

            // Handle double-encoded JSON
            if (typeof historyData === 'string') {
                historyData = JSON.parse(historyData);
            }

            if (Array.isArray(historyData) && historyData.length > 0) {
                const history: RefreshHistoryEntry[] = historyData.map((item: any) => ({
                    startTime: item.startTime || item.StartTime,
                    status: item.status || item.Status,
                }));

                // Sort by startTime descending to ensure the first element is the most recent.
                history.sort((a, b) => {
                    const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
                    const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
                    return dateB - dateA;
                });
                
                const latestRun = history[0];
                if (latestRun) {
                    lastRefreshStatus = getDisplayStatus(latestRun.status);
                    lastRefreshDate = latestRun.startTime;
                }
                
                // Get statuses for the last 5 runs for the summary, reversed to show oldest-to-newest
                refreshHistorySummary = history.slice(0, 5).map(run => getDisplayStatus(run.status)).reverse();
            }
        } catch (e) {
            console.error(`Failed to parse refresh history for dataflow '${flow.msdyn_name}':`, e);
        }
    }

    return {
        ...flow,
        lastRefreshStatus,
        lastRefreshDate,
        refreshHistorySummary,
    };
  });

  return {
    dataflows: processedDataflows,
    nextLink: data['@odata.nextLink'] || null,
    totalCount: data['@odata.count'] ?? -1, // Use -1 to indicate count is not in this response
  };
};