import React, { useState, useEffect, useCallback } from 'react';
import { fetchDataflows, fetchAccessToken } from './services/dataverseService';
import type { Dataflow } from './types';
import DataflowTable from './components/DataflowTable';
import DataflowDetailSidebar from './components/DataflowDetailModal';
import { LoadingIcon, SearchIcon, UserIcon } from './components/IconComponents';
import { sampleData } from './sampleData';
import { BASE_DATAVERSE_URL, DATAFLOW_FIELDS } from './constants';

const PAGE_SIZE = 50;

// Custom hook for debouncing input values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


interface PaginationProps {
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onNext: () => void;
    onPrev: () => void;
    hasNextPage: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalCount, pageSize, onNext, onPrev, hasNextPage }) => {
    if (totalCount === 0) return null;

    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalCount);

    const isPrevDisabled = currentPage === 1;
    const isNextDisabled = !hasNextPage || currentPage === totalPages;

    return (
        <div className="flex items-center justify-between text-sm text-slate-400 flex-wrap gap-4">
            <div>
                Showing <span className="font-semibold text-white">{startIndex}</span> to <span className="font-semibold text-white">{endIndex}</span> of <span className="font-semibold text-white">{totalCount.toLocaleString()}</span> results
            </div>
            <div className="flex items-center space-x-4">
                <span>Page <span className="font-semibold text-white">{currentPage}</span> of <span className="font-semibold text-white">{totalPages.toLocaleString()}</span></span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onPrev}
                        disabled={isPrevDisabled}
                        className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                        aria-label="Go to previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={onNext}
                        disabled={isNextDisabled}
                        className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                        aria-label="Go to next page"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [dataflows, setDataflows] = useState<Dataflow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const [selectedDataflow, setSelectedDataflow] = useState<Dataflow | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextLink, setNextLink] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  
  // Debounce filter inputs to avoid excessive API calls
  const debouncedFilter = useDebounce(filter, 500);
  const debouncedOwnerFilter = useDebounce(ownerFilter, 500);

  const handleFetchData = useCallback(async (urlToFetch: string) => {
    setIsLoading(true);
    setError(null);
    setIsDemoMode(false);
    try {
      const accessToken = await fetchAccessToken();
      const result = await fetchDataflows(accessToken, urlToFetch);
      setDataflows(result.dataflows);
      setNextLink(result.nextLink);
      // Only set totalCount if it's provided in the response (i.e., on the first page load)
      if (result.totalCount !== -1) {
        setTotalCount(result.totalCount);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to fetch data: ${err.message}. Running in Demo Mode.`);
      } else {
        setError('An unknown error occurred. Running in Demo Mode.');
      }
      setDataflows(sampleData);
      setTotalCount(0);
      setCurrentPage(1);
      setNextLink(null);
      setPageHistory([]);
      setIsDemoMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to re-fetch data when debounced filter values change
  useEffect(() => {
    const filterParts: string[] = ['statecode eq 0'];

    if (debouncedFilter) {
      // Escape single quotes for OData query
      const safeFilter = debouncedFilter.replace(/'/g, "''");
      const generalFilter = `(contains(msdyn_name, '${safeFilter}') or contains(msdyn_description, '${safeFilter}'))`;
      filterParts.push(generalFilter);
    }
    
    if (debouncedOwnerFilter) {
      const safeOwnerFilter = debouncedOwnerFilter.replace(/'/g, "''");
      // To filter on the owner's name, we use the 'owninguser' navigation property.
      const ownerFilterStr = `contains(owninguser/fullname, '${safeOwnerFilter}')`;
      filterParts.push(ownerFilterStr);
    }

    const queryParams: string[] = [
        `$select=${DATAFLOW_FIELDS}`,
        `$filter=${filterParts.join(' and ')}`,
        `$count=true`,
        `$top=${PAGE_SIZE}`,
        `$orderby=msdyn_name asc`
    ];

    // When filtering on a related entity's property (like the owner's name),
    // we must use $expand to make that relationship available to the filter clause.
    if (debouncedOwnerFilter) {
        queryParams.push(`$expand=owninguser($select=fullname)`);
    }

    const newUrl = `${BASE_DATAVERSE_URL}?${queryParams.join('&')}`;
    
    // Reset pagination and fetch data whenever filters change
    setCurrentPage(1);
    setPageHistory([newUrl]);
    handleFetchData(newUrl);
    
  }, [debouncedFilter, debouncedOwnerFilter, handleFetchData]);
  
  const handleNextPage = () => {
    if (nextLink) {
        setPageHistory(prev => [...prev, nextLink]);
        setCurrentPage(prev => prev + 1);
        handleFetchData(nextLink);
    }
  };

  const handlePrevPage = () => {
      if (currentPage > 1) {
          const newHistory = [...pageHistory];
          newHistory.pop();
          const prevPageUrl = newHistory[newHistory.length - 1];
          
          if (prevPageUrl) {
            setPageHistory(newHistory);
            setCurrentPage(prev => prev - 1);
            handleFetchData(prevPageUrl);
          }
      }
  };

  const handleRowClick = (dataflow: Dataflow) => {
    setSelectedDataflow(dataflow);
  };

  const handleCloseModal = () => {
    setSelectedDataflow(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg">
          <LoadingIcon />
          <p className="mt-4 text-lg text-slate-400">Fetching dataflows...</p>
        </div>
      );
    }
    
    if (dataflows.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-900 rounded-lg">
                <p className="text-lg text-slate-400">
                  No dataflows found
                </p>
                <p className="text-sm text-slate-500">
                  Try adjusting your filter criteria or check if any dataflows exist.
                </p>
            </div>
        );
    }

    return <DataflowTable dataflows={dataflows} onRowClick={handleRowClick} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {isDemoMode && (
          <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Demo Mode</strong>
            <span className="block sm:inline ml-2">The application is running with sample data because environment variables are not set. This is a fully interactive demonstration.</span>
          </div>
        )}
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-white">Dataflow Tracker</h1>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search name/description..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    aria-label="Filter dataflows by name or description"
                />
            </div>
            <div className="relative sm:w-72">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon />
                </div>
                <input
                    type="text"
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    placeholder="Filter by owner..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    aria-label="Filter dataflows by owner"
                />
            </div>
        </div>

        <main>
            {!isLoading && totalCount > 0 && (
              <div className="pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  onNext={handleNextPage}
                  onPrev={handlePrevPage}
                  hasNextPage={!!nextLink}
                />
              </div>
            )}
            {renderContent()}
        </main>

      </div>
      <DataflowDetailSidebar dataflow={selectedDataflow} onClose={handleCloseModal} />
    </div>
  );
};

export default App;