export interface TranslationRecord {
  id: string; // Unique identifier for React keys
  taskName: string; // From Sheet Name
  originalId: string; // Column 1 (Sort ID) - kept for reference
  key: string; // Column 2
  sourceText: string; // Column 3
  notes: Record<string, string>; // Other columns
}

export interface ParseStats {
  totalFiles: number;
  totalSheets: number;
  totalRecords: number;
  parseTimeMs: number;
}

export interface SearchFilters {
  query: string;
}
