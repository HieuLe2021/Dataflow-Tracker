import React from 'react';
import type { Dataflow } from '../types';

interface DataflowTableProps {
  dataflows: Dataflow[];
  onRowClick: (dataflow: Dataflow) => void;
}

const getRelativeTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown Time';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Unknown Time';
    }

    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (seconds < 1) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.round(hours / 24);
    return `${days} days ago`;
};

const StatusText: React.FC<{ status: string | undefined }> = ({ status }) => {
    if (!status) {
        return <p className="font-semibold text-slate-500">Unknown</p>;
    }
    
    let color = 'text-slate-400';
    switch (status.toLowerCase()) {
        case 'completed':
        case 'success':
            color = 'text-green-400';
            break;
        case 'failed':
        case 'error':
            color = 'text-red-400';
            break;
        case 'warning':
            color = 'text-yellow-400';
            break;
        case 'cancelled':
            color = 'text-slate-500';
            break;
    }
    
    return <p className={`font-semibold ${color}`}>{status}</p>;
};

const RefreshHistorySparkline: React.FC<{ history: string[] | undefined }> = ({ history }) => {
    if (!history || history.length === 0) {
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'bg-green-500';
            case 'failed':
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'cancelled':
                return 'bg-slate-600';
            default:
                return 'bg-slate-400';
        }
    };

    return (
        <div className="flex items-center space-x-1 mt-1.5" aria-label={`Recent refresh history: ${history.join(', ')}`}>
            {history.map((status, index) => (
                <div 
                    key={index}
                    className={`w-3 h-3 rounded-sm ${getStatusColor(status)}`}
                    title={`Run ${index + 1}: ${status} `}
                ></div>
            ))}
        </div>
    );
};


const DataflowTable: React.FC<DataflowTableProps> = ({ dataflows, onRowClick }) => {
  return (
    <div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b-2 border-slate-800">
            <span>Name &amp; Description</span>
            <span className="w-40 text-left">Last Refresh</span>
            <span className="w-32 text-left">Owner</span>
        </div>
        <div className="space-y-1 mt-2">
            {dataflows.map((flow) => (
                <div 
                    key={flow.msdyn_dataflowid} 
                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors duration-150"
                    onClick={() => onRowClick(flow)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onRowClick(flow)}
                    aria-label={`View details for ${flow.msdyn_name}`}
                >
                    <div className="truncate">
                        <p className="font-semibold text-white truncate">{flow.msdyn_name}</p>
                        <p className="text-sm text-slate-400 truncate">{flow.msdyn_description || 'No description'}</p>
                    </div>
                    <div className="w-40 text-left">
                        <StatusText status={flow.lastRefreshStatus} />
                        <p className="text-sm text-slate-500">{getRelativeTime(flow.lastRefreshDate)}</p>
                        <RefreshHistorySparkline history={flow.refreshHistorySummary} />
                    </div>
                    <div className="w-32 text-left text-sm text-slate-400 truncate">
                        {flow['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'N/A'}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default DataflowTable;