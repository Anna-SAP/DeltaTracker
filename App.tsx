import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import * as AutoSizerPkg from 'react-virtualized-auto-sizer';
import * as ReactWindowPkg from 'react-window';
import { Search, Database, Sparkles, XCircle, BarChart3, CheckCircle2, ListFilter } from 'lucide-react';
import { parseExcelFiles } from './utils/excelParser';
import DropZone from './components/DropZone';
import ResultCard from './components/ResultCard';
import { useDebounce } from './hooks/useDebounce';
import { TranslationRecord, ParseStats } from './types';

// Robust import handling for ESM/CJS interop via esm.sh
const List = (ReactWindowPkg as any).FixedSizeList || (ReactWindowPkg as any).default?.FixedSizeList;
const AutoSizer = (AutoSizerPkg as any).default || AutoSizerPkg;

const App: React.FC = () => {
  // State
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<ParseStats | null>(null);

  // Split Search Results State
  const [exactMatches, setExactMatches] = useState<TranslationRecord[]>([]);
  const [fuzzyMatches, setFuzzyMatches] = useState<TranslationRecord[]>([]);

  // Search Logic
  const debouncedQuery = useDebounce(searchQuery, 150);

  // Fuse Instance Configuration
  const fuse = useMemo(() => {
    if (records.length === 0) return null;
    
    return new Fuse(records, {
      keys: [
        { name: 'taskName', weight: 0.3 },
        { name: 'key', weight: 1.0 }, 
        { name: 'sourceText', weight: 0.8 },
      ],
      threshold: 0.3,
      distance: 100,
      ignoreLocation: true,
      useExtendedSearch: true,
    });
  }, [records]);

  // Handle File Upload
  const handleFiles = async (files: File[]) => {
    setIsProcessing(true);
    const startTime = performance.now();
    
    try {
      const newRecords = await parseExcelFiles(files);
      const endTime = performance.now();
      
      setRecords((prev) => [...prev, ...newRecords]);
      setStats({
        totalFiles: files.length,
        totalSheets: new Set(newRecords.map(r => r.taskName)).size,
        totalRecords: newRecords.length,
        parseTimeMs: Math.round(endTime - startTime)
      });
      
    } catch (error) {
      console.error("Failed to parse", error);
      alert("Failed to parse some files. Please ensure they are valid Excel files.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform Search Effect (Split Logic)
  useEffect(() => {
    const query = debouncedQuery.trim();

    if (!query) {
      setExactMatches([]);
      setFuzzyMatches(records); // If no query, everything is treated as a list in the "default" view
      return;
    }

    if (!fuse) return;

    const normQuery = query.toLowerCase();

    // Helper to escape regex special characters to prevent errors
    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 1. Identify Exact Matches
    // Logic: 
    //  a) Strict equality (case-insensitive)
    //  b) Whole Word Match: query is surrounded by delimiters (start/end, dot, underscore, dash, whitespace)
    
    const escapedQuery = escapeRegExp(query);
    // Regex matches: (Start OR Separator) + Query + (Separator OR End)
    // Removed the extra space in the second capturing group that was causing issues with underscores
    const exactMatchRegex = new RegExp(`(^|[\\s._-])${escapedQuery}([\\s._-]|$)`, 'i');

    const exact = records.filter((r) => {
        // Condition A: Strict Equality
        if (r.key.toLowerCase() === normQuery || r.sourceText.toLowerCase() === normQuery) {
          return true;
        }
        
        // Condition B: Whole Word Regex Match
        // We check both key and sourceText
        if (exactMatchRegex.test(r.key) || exactMatchRegex.test(r.sourceText)) {
          return true;
        }

        return false;
    });

    const exactIds = new Set(exact.map(r => r.id));

    // 2. Fuzzy Search (excluding items already found in Exact list)
    const fuseResults = fuse.search(query);
    const fuzzy = fuseResults
      .map((result) => result.item)
      .filter((item) => !exactIds.has(item.id));

    setExactMatches(exact);
    setFuzzyMatches(fuzzy);
  }, [debouncedQuery, records, fuse]);

  // Reset
  const handleReset = () => {
    setRecords([]);
    setExactMatches([]);
    setFuzzyMatches([]);
    setStats(null);
    setSearchQuery('');
  };

  // Helper to determine if we are in "Search Mode" or "Browse Mode"
  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans text-royal-text">
      
      {/* Header Section */}
      <header className="bg-royal-blue sticky top-0 z-20 shadow-md border-b border-royal-blueDark shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg border border-white/20">
               <Sparkles className="text-royal-gold w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              L10n Tracker
            </h1>
          </div>

          {records.length > 0 && (
             <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-white/90">
                <div className="flex items-center space-x-2 bg-royal-blueDark/50 px-3 py-1.5 rounded-md border border-white/10">
                  <Database size={16} className="text-blue-200" />
                  <span>{records.length.toLocaleString()} Records</span>
                </div>
                {stats && (
                    <div className="flex items-center space-x-2 bg-royal-blueDark/50 px-3 py-1.5 rounded-md border border-white/10">
                        <BarChart3 size={16} className="text-green-300" />
                        <span>{stats.parseTimeMs}ms</span>
                    </div>
                )}
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-sm font-bold border border-red-800"
                >
                  <XCircle size={16} />
                  <span>Reset</span>
                </button>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 overflow-hidden h-[calc(100vh-80px)]">
        
        {/* Upload State */}
        {records.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <DropZone onFilesSelected={handleFiles} isProcessing={isProcessing} />
            </div>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative w-full max-w-4xl mx-auto shrink-0 z-10">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-royal-blue" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-royal-blue rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:border-royal-blue focus:ring-4 focus:ring-royal-blue/20 transition-all duration-200 shadow-sm text-lg text-black font-medium"
                  placeholder="Search by Task, Key, or Text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
            </div>

            {/* Results Area */}
            <div className="flex-grow min-h-0 w-full">
              {!isSearchMode ? (
                // Single Column Layout for "All Records" (Browse Mode)
                <div className="h-full w-full bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden flex flex-col">
                   <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
                      <div className="flex items-center space-x-2 text-gray-700 font-bold">
                        <ListFilter size={18} />
                        <span>All Records</span>
                      </div>
                      <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">
                        {records.length}
                      </span>
                   </div>
                   <div className="flex-1">
                    <AutoSizer>
                      {({ height, width }: { height: number; width: number }) => (
                        <List
                          height={height}
                          itemCount={records.length}
                          itemSize={180}
                          width={width}
                          className="no-scrollbar"
                        >
                          {({ index, style }: { index: number; style: React.CSSProperties }) => (
                            <ResultCard 
                              data={records[index]} 
                              style={{ ...style, height: Number(style.height) - 10, width: '100%' }} 
                              index={index} 
                            />
                          )}
                        </List>
                      )}
                    </AutoSizer>
                  </div>
                </div>
              ) : (
                // Dual Column Layout for "Search Results"
                <div className="h-full flex flex-col md:flex-row gap-4">
                  
                  {/* Left Column: Exact Matches */}
                  <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border-2 border-royal-blue shadow-md overflow-hidden">
                    <div className="bg-royal-blue/5 px-4 py-3 border-b-2 border-royal-blue flex justify-between items-center shrink-0">
                       <div className="flex items-center space-x-2 text-royal-blue font-bold">
                          <CheckCircle2 size={18} className="text-royal-gold" />
                          <span>Exact Matches</span>
                       </div>
                       <span className="text-xs font-bold bg-royal-blue text-white px-2 py-1 rounded">
                         {exactMatches.length}
                       </span>
                    </div>
                    
                    <div className="flex-1 relative">
                       {exactMatches.length === 0 ? (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic p-4 text-center">
                           No exact matches found for "{searchQuery}"
                         </div>
                       ) : (
                         <AutoSizer>
                          {({ height, width }: { height: number; width: number }) => (
                            <List
                              height={height}
                              itemCount={exactMatches.length}
                              itemSize={180}
                              width={width}
                              className="no-scrollbar"
                            >
                              {({ index, style }: { index: number; style: React.CSSProperties }) => (
                                <ResultCard 
                                  data={exactMatches[index]} 
                                  style={{ ...style, height: Number(style.height) - 10, width: '100%' }} 
                                  index={index} 
                                />
                              )}
                            </List>
                          )}
                        </AutoSizer>
                       )}
                    </div>
                  </div>

                  {/* Right Column: Fuzzy/Related Matches */}
                  <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
                       <div className="flex items-center space-x-2 text-gray-700 font-bold">
                          <Sparkles size={18} className="text-gray-500" />
                          <span>Related / Fuzzy</span>
                       </div>
                       <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">
                         {fuzzyMatches.length}
                       </span>
                    </div>
                    
                    <div className="flex-1 relative">
                       {fuzzyMatches.length === 0 ? (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic p-4 text-center">
                           No related results found
                         </div>
                       ) : (
                         <AutoSizer>
                          {({ height, width }: { height: number; width: number }) => (
                            <List
                              height={height}
                              itemCount={fuzzyMatches.length}
                              itemSize={180}
                              width={width}
                              className="no-scrollbar"
                            >
                              {({ index, style }: { index: number; style: React.CSSProperties }) => (
                                <ResultCard 
                                  data={fuzzyMatches[index]} 
                                  style={{ ...style, height: Number(style.height) - 10, width: '100%' }} 
                                  index={index} 
                                />
                              )}
                            </List>
                          )}
                        </AutoSizer>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;