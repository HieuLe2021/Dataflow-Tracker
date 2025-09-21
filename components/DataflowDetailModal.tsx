import React, { useEffect } from 'react';
import type { Dataflow, RefreshHistoryEntry } from '../types';
import { CloseIcon } from './IconComponents';

interface DataflowDetailSidebarProps {
  dataflow: Dataflow | null;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="py-4 border-b border-slate-700">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <p className="mt-1 text-base text-white break-words">{value || 'N/A'}</p>
    </div>
);

const ScrollableCodeBox: React.FC<{ title: string; data: string | null | undefined }> = ({ title, data }) => {
    if (!data) return <DetailItem label={title} value="Not available" />;
    
    return (
        <div className="py-4 border-b border-slate-700">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <div className="mt-1 bg-slate-950 rounded p-2 overflow-x-auto">
                <code className="text-sm text-slate-300 whitespace-pre font-mono">{data}</code>
            </div>
        </div>
    );
};

const RefreshHistory: React.FC<{ history: string | null | undefined }> = ({ history }) => {
    if (!history) {
        return <DetailItem label="Refresh History" value="No history available" />;
    }

    let parsedHistory: RefreshHistoryEntry[] = [];
    try {
        let parsedData = JSON.parse(history);

        // Handle cases where the JSON is double-stringified
        if (typeof parsedData === 'string') {
            parsedData = JSON.parse(parsedData);
        }

        if (Array.isArray(parsedData)) {
            const normalizedHistory = parsedData
                .map((item: any) => ({
                    startTime: item.startTime || item.StartTime,
                    status: item.status || item.Status,
                }))
                .filter(item => item.startTime || item.status); // Keep if at least one field is present

            parsedHistory = normalizedHistory;
            
            // Sort by startTime descending to show the most recent first
            parsedHistory.sort((a, b) => {
                const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
                const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
                return dateB - dateA;
            });
        }
    } catch (e) {
        console.error("Failed to parse refresh history:", e, { originalHistory: history });
    }

    const getDisplayStatus = (status: string | null | undefined): string => {
        if (!status || !status.trim() || status.trim().toLowerCase() === 'null') {
            return 'Unknown';
        }
        return status;
    };

    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        let color = 'bg-slate-600 text-slate-200';
        switch (status?.toLowerCase()) {
            case 'success':
            case 'completed':
                color = 'bg-green-500 text-white';
                break;
            case 'error':
            case 'failed':
                color = 'bg-red-500 text-white';
                break;
            case 'warning':
                color = 'bg-yellow-500 text-white';
                break;
            case 'cancelled':
                color = 'bg-slate-500 text-white';
                break;
        }
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>{status}</span>;
    };

    return (
        <div className="py-4 border-b border-slate-700">
            <p className="text-sm font-medium text-slate-400">Refresh History</p>
            <div className="mt-2 max-h-60 overflow-y-auto pr-2 relative">
                {parsedHistory.length > 0 ? (
                    <table className="w-full text-sm text-left table-auto">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-4 py-2 font-semibold">Start Time</th>
                                <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-950/50">
                            {parsedHistory.map((run, index) => (
                                <tr key={index} className="border-b border-slate-700 hover:bg-slate-800/60">
                                    <td className="px-4 py-2 font-mono text-slate-300">
                                        {run.startTime ? new Date(run.startTime).toLocaleString() : 'Unknown Time'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <StatusBadge status={getDisplayStatus(run.status)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 mt-2">Could not parse history or no records found.</p>
                )}
            </div>
        </div>
    );
};

const DataflowDetailSidebar: React.FC<DataflowDetailSidebarProps> = ({ dataflow, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const isVisible = !!dataflow;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidebar-title"
      className={`fixed inset-0 z-50 transition-colors duration-300 ease-in-out ${isVisible ? 'bg-black/70' : 'bg-transparent pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {dataflow && (
          <>
            <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0 bg-slate-800/30">
              <h2 id="sidebar-title" className="text-xl font-semibold text-white truncate">{dataflow.msdyn_name}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close sidebar">
                <CloseIcon />
              </button>
            </header>

            <main className="p-6 overflow-y-auto text-slate-300 flex-grow">
              <DetailItem label="Description" value={dataflow.msdyn_description} />
              <DetailItem label="Dataflow ID" value={dataflow.msdyn_dataflowid} />
              <DetailItem label="Owner" value={dataflow['_ownerid_value@OData.Community.Display.V1.FormattedValue']} />
              <DetailItem label="Last Modified" value={new Date(dataflow.modifiedon).toLocaleString()} />
              <DetailItem label="Internal Version" value={dataflow.msdyn_internalversion} />
              <DetailItem label="Gateway Object ID" value={dataflow.msdyn_gatewayobjectid} />
              
              <RefreshHistory history={dataflow.msdyn_refreshhistory} />
              
              <ScrollableCodeBox title="Mashup Document" data={dataflow.msdyn_mashupdocument} />
              <ScrollableCodeBox title="Refresh Settings" data={dataflow.msdyn_refreshsettings} />
              <ScrollableCodeBox title="Mashup Settings" data={dataflow.msdyn_mashupsettings} />
              <ScrollableCodeBox title="Email Settings" data={dataflow.msdyn_emailsettings} />
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default DataflowDetailSidebar;