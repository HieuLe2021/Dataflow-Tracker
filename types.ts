export interface RefreshHistoryEntry {
  startTime: string;
  status: string;
}

export interface Dataflow {
  msdyn_dataflowid: string;
  msdyn_name: string;
  modifiedon: string;
  createdon: string;
  msdyn_mashupdocument?: string;
  msdyn_description: string | null;
  msdyn_destinationadls: boolean | null;
  'msdyn_destinationadls@OData.Community.Display.V1.FormattedValue'?: string;
  msdyn_emailsettings: string | null;
  msdyn_gatewayobjectid: string | null;
  msdyn_internalversion: string | null;
  msdyn_mashupsettings: string | null;
  msdyn_originaldataflowid: string | null;
  msdyn_refreshhistory: string | null;
  msdyn_refreshsettings: string | null;

  // Owner
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;

  // Derived fields for latest refresh status
  lastRefreshStatus?: string;
  lastRefreshDate?: string;
  refreshHistorySummary?: string[];
}

export interface DataverseResponse {
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: Dataflow[];
}

export interface FetchDataflowsResult {
  dataflows: Dataflow[];
  nextLink: string | null;
  totalCount: number;
}