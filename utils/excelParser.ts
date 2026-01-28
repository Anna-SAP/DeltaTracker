import * as XLSX from 'xlsx';
import { TranslationRecord } from '../types';

/**
 * Parses uploaded Excel files into a unified list of TranslationRecords.
 * 
 * Logic:
 * - Sheet Name = Task Name
 * - Col 0 (A) = Sort ID (kept as originalId)
 * - Col 1 (B) = Key/ID (indexed)
 * - Col 2 (C) = Source Text (indexed)
 * - Col 3+ = Notes
 */
export const parseExcelFiles = async (files: File[]): Promise<TranslationRecord[]> => {
  const allRecords: TranslationRecord[] = [];

  for (const file of files) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      // Convert sheet to array of arrays for easier column access
      // header: 1 means result is string[][]
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

      // Process rows
      jsonData.forEach((row, rowIndex) => {
        // Simple heuristic: Skip empty rows or rows that look like headers
        // Valid row must have at least a key (Col 1) or Source (Col 2)
        if (!row || row.length < 2) return;

        const keyVal = row[1] ? String(row[1]).trim() : '';
        const sourceVal = row[2] ? String(row[2]).trim() : '';

        // Skip header row if it contains "Key" and "Source" or "Value" exactly
        if (rowIndex < 5 && 
           (keyVal.toLowerCase() === 'key' || keyVal.toLowerCase() === 'id') && 
           (sourceVal.toLowerCase() === 'value' || sourceVal.toLowerCase() === 'source' || sourceVal.toLowerCase().includes('text'))) {
          return;
        }

        if (!keyVal && !sourceVal) return;

        // Collect extra columns as notes
        const notes: Record<string, string> = {};
        for (let i = 3; i < row.length; i++) {
            if (row[i]) notes[`col_${i}`] = String(row[i]);
        }

        allRecords.push({
          id: `${sheetName}-${rowIndex}-${Math.random().toString(36).substr(2, 9)}`,
          taskName: sheetName,
          originalId: row[0] ? String(row[0]) : '',
          key: keyVal,
          sourceText: sourceVal,
          notes: notes
        });
      });
    });
  }

  return allRecords;
};
