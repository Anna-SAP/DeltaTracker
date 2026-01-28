import React from 'react';
import { TranslationRecord } from '../types';
import { FileText, Key, Hash } from 'lucide-react';
import { clsx } from 'clsx';

interface ResultCardProps {
  data: TranslationRecord;
  style: React.CSSProperties;
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, style, index }) => {
  // High contrast distinctive colors for left border
  const borderColors = [
    'border-l-[#002366]', // Royal Blue
    'border-l-[#B91C1C]', // Red 700
    'border-l-[#047857]', // Emerald 700
    'border-l-[#D97706]', // Amber 600
    'border-l-[#7E22CE]', // Purple 700
  ];
  const accentColor = borderColors[index % borderColors.length];

  return (
    <div style={style} className="px-2 py-2">
      <div className={clsx(
        "h-full w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-300 border-l-[8px] p-5 flex flex-col justify-between overflow-hidden",
        accentColor
      )}>
        
        {/* Header: Task Name & ID */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-royal-blue text-white shrink-0 shadow-sm">
               <FileText size={14} />
            </span>
            <span className="font-bold text-base text-gray-900 truncate" title={data.taskName}>
              {data.taskName}
            </span>
          </div>
          {data.originalId && (
            <div className="flex items-center space-x-1 text-xs font-mono font-bold text-gray-500 shrink-0 bg-gray-100 px-2 py-1 rounded border border-gray-200">
              <Hash size={12} />
              <span>{data.originalId}</span>
            </div>
          )}
        </div>

        {/* Key Section - High Contrast Box */}
        <div className="mb-3 bg-slate-50 p-2.5 rounded border border-slate-300 group">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
            <Key size={12} />
            <span>Key Identifier</span>
          </div>
          <div className="text-sm font-mono font-medium text-royal-blue break-all selection:bg-yellow-200">
            {data.key || <span className="italic text-gray-400">No Key</span>}
          </div>
        </div>

        {/* Source Text Section - Darker text for readability */}
        <div className="flex-grow">
          <div className="text-sm text-gray-900 leading-relaxed break-words font-medium selection:bg-yellow-200">
             {data.sourceText}
          </div>
          {!data.sourceText && (
             <span className="text-sm text-gray-400 italic">Empty source text</span>
          )}
        </div>

        {/* Notes Preview (if any) */}
        {Object.keys(data.notes).length > 0 && (
           <div className="mt-2 text-xs text-gray-500 truncate border-t border-gray-200 pt-2">
             <span className="font-bold text-gray-700">Note: </span>
             {Object.values(data.notes).join(' | ')}
           </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ResultCard);