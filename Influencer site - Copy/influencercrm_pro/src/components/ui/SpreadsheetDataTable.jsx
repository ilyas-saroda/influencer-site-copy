/**
 * Enterprise Spreadsheet Data Table Component
 * Displays imported spreadsheet data in a dynamic, Excel-like table
 * Supports sorting, filtering, searching, and export functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Download, 
  Eye, 
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { spreadsheetService } from '../../services/spreadsheetService';
import ExportButton from './ExportButton';
import Button from './Button';

const SpreadsheetDataTable = ({ 
  data = [], 
  headers = [], 
  metadata = {},
  className = '',
  maxHeight = '600px',
  showExport = true,
  showSearch = true,
  showColumnToggle = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = data;

    // Apply search filter
    if (searchTerm) {
      filteredData = data.filter(row => 
        Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        // Handle null/undefined values
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Compare values
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = aValue.toString().localeCompare(bValue.toString());
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  // Visible columns
  const visibleHeaders = useMemo(() => 
    headers.filter(header => !hiddenColumns.has(header)),
    [headers, hiddenColumns]
  );

  // Handle column sorting
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((column) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);

  // Reset pagination when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortColumn, sortDirection]);

  // Get cell value display
  const getCellValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  };

  if (!data || data.length === 0) {
    return (
      <div className={`spreadsheet-data-table ${className}`}>
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-2">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 font-medium">No data to display</p>
          <p className="text-gray-500 text-sm mt-1">Import a spreadsheet to see data here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`spreadsheet-data-table ${className}`}>
      {/* Table controls */}
      <div className="bg-white border border-gray-200 rounded-t-lg p-4 space-y-3">
        {/* Metadata and controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            {metadata && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{metadata.rowCount || data.length}</span> rows ×{' '}
                <span className="font-medium">{metadata.columnCount || headers.length}</span> columns
                {metadata.fileName && (
                  <span className="ml-2 text-gray-500">({metadata.fileName})</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showExport && (
              <ExportButton
                data={processedData}
                headers={visibleHeaders}
                metadata={metadata}
                onExportComplete={(result) => {
                  console.log('Export completed:', result);
                }}
                onError={(error) => {
                  console.error('Export error:', error);
                }}
                size="sm"
                variant="outline"
              />
            )}
            
            {showColumnToggle && (
              <div className="relative">
                <Button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Columns</span>
                </Button>
                
                {showColumnMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-48">
                    <div className="max-h-64 overflow-y-auto">
                      {headers.map(header => (
                        <label
                          key={header}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!hiddenColumns.has(header)}
                            onChange={() => toggleColumnVisibility(header)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{header}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in all columns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Table container */}
      <div 
        className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {visibleHeaders.map((header, index) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="truncate" title={header}>
                        {header}
                      </span>
                      {sortColumn === header && (
                        sortDirection === 'asc' ? (
                          <SortAsc className="w-3 h-3 text-blue-600" />
                        ) : (
                          <SortDesc className="w-3 h-3 text-blue-600" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {visibleHeaders.map((header, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100 whitespace-nowrap"
                    >
                      <div className="truncate" title={getCellValue(row[header])}>
                        {getCellValue(row[header])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to{' '}
                {Math.min(currentPage * rowsPerPage, processedData.length)} of{' '}
                {processedData.length} results
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={250}>250 rows</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetDataTable;
