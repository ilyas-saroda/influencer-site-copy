/**
 * Enterprise Backend Server for Spreadsheet Import Feature
 * Provides RESTful API endpoints for spreadsheet data operations
 * Built with Express.js for production-ready deployment
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv', // .csv (alternative MIME type)
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
    }
  },
});

// In-memory storage for demonstration (replace with database in production)
const spreadsheetStore = new Map();
let nextId = 1;

// Utility functions
const generateId = () => (nextId++).toString();

const validateSpreadsheetData = (data) => {
  const errors = [];
  
  if (!data || !Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }
  
  if (data.length === 0) {
    errors.push('Data array cannot be empty');
    return { isValid: false, errors };
  }
  
  // Validate each row
  data.forEach((row, index) => {
    if (typeof row !== 'object' || row === null) {
      errors.push(`Row ${index + 1} must be an object`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

const createSpreadsheetRecord = (data, headers, metadata, userId) => ({
  id: generateId(),
  data,
  headers,
  metadata: {
    ...metadata,
    uploadedAt: new Date().toISOString(),
    userId: userId || 'anonymous',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// API Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * Import spreadsheet data
 */
app.post('/api/spreadsheet/import', (req, res) => {
  try {
    const { data, headers, metadata, userId } = req.body;
    
    // Validate input
    if (!data || !headers) {
      return res.status(400).json({
        error: 'Missing required fields: data and headers are required',
      });
    }
    
    // Validate data structure
    const validation = validateSpreadsheetData(data);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid data format',
        details: validation.errors,
      });
    }
    
    // Create spreadsheet record
    const record = createSpreadsheetRecord(data, headers, metadata, userId);
    
    // Store in memory (replace with database in production)
    spreadsheetStore.set(record.id, record);
    
    res.status(201).json({
      message: 'Spreadsheet imported successfully',
      spreadsheetId: record.id,
      record: {
        id: record.id,
        rowCount: data.length,
        columnCount: headers.length,
        metadata: record.metadata,
        createdAt: record.createdAt,
      },
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Internal server error during import',
      message: error.message,
    });
  }
});

/**
 * Get all spreadsheets for a user
 */
app.get('/api/spreadsheet/list', (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.query.userId || 'anonymous';
    
    // Filter spreadsheets by user
    const userSpreadsheets = Array.from(spreadsheetStore.values())
      .filter(spreadsheet => spreadsheet.metadata.userId === userId);
    
    // Sort spreadsheets
    userSpreadsheets.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder === 'desc' ? -1 : 1;
      
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSpreadsheets = userSpreadsheets.slice(startIndex, endIndex);
    
    // Return summary data (not full data for list view)
    const summaryData = paginatedSpreadsheets.map(spreadsheet => ({
      id: spreadsheet.id,
      fileName: spreadsheet.metadata.fileName,
      fileType: spreadsheet.metadata.fileType,
      rowCount: spreadsheet.data.length,
      columnCount: spreadsheet.headers.length,
      createdAt: spreadsheet.createdAt,
      updatedAt: spreadsheet.updatedAt,
    }));
    
    res.json({
      spreadsheets: summaryData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: userSpreadsheets.length,
        pages: Math.ceil(userSpreadsheets.length / limit),
      },
    });
    
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching spreadsheets',
      message: error.message,
    });
  }
});

/**
 * Get specific spreadsheet by ID
 */
app.get('/api/spreadsheet/:id', (req, res) => {
  try {
    const { id } = req.params;
    const spreadsheet = spreadsheetStore.get(id);
    
    if (!spreadsheet) {
      return res.status(404).json({
        error: 'Spreadsheet not found',
      });
    }
    
    res.json(spreadsheet);
    
  } catch (error) {
    console.error('Get spreadsheet error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching spreadsheet',
      message: error.message,
    });
  }
});

/**
 * Update spreadsheet
 */
app.put('/api/spreadsheet/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const spreadsheet = spreadsheetStore.get(id);
    if (!spreadsheet) {
      return res.status(404).json({
        error: 'Spreadsheet not found',
      });
    }
    
    // Update spreadsheet
    const updatedSpreadsheet = {
      ...spreadsheet,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    spreadsheetStore.set(id, updatedSpreadsheet);
    
    res.json({
      message: 'Spreadsheet updated successfully',
      spreadsheet: updatedSpreadsheet,
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      error: 'Internal server error during update',
      message: error.message,
    });
  }
});

/**
 * Delete spreadsheet
 */
app.delete('/api/spreadsheet/:id', (req, res) => {
  try {
    const { id } = req.params;
    const spreadsheet = spreadsheetStore.get(id);
    
    if (!spreadsheet) {
      return res.status(404).json({
        error: 'Spreadsheet not found',
      });
    }
    
    spreadsheetStore.delete(id);
    
    res.json({
      message: 'Spreadsheet deleted successfully',
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Internal server error during deletion',
      message: error.message,
    });
  }
});

/**
 * Export spreadsheet in multiple formats
 */
app.get('/api/spreadsheet/:id/export', (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    const spreadsheet = spreadsheetStore.get(id);
    if (!spreadsheet) {
      return res.status(404).json({
        error: 'Spreadsheet not found',
      });
    }
    
    if (format === 'json') {
      res.json(spreadsheet);
    } else if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = spreadsheet.headers.join(',');
      const csvRows = spreadsheet.data.map(row =>
        spreadsheet.headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="spreadsheet_${id}.csv"`);
      res.send(csvContent);
    } else if (format === 'xlsx') {
      // Convert to Excel format
      const XLSX = require('xlsx');
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet format
      const worksheetData = [spreadsheet.headers];
      spreadsheet.data.forEach(row => {
        const rowData = spreadsheet.headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
          return value;
        });
        worksheetData.push(rowData);
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, spreadsheet.metadata.sheetName || 'Export Data');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="spreadsheet_${id}.xlsx"`);
      res.send(excelBuffer);
    } else if (format === 'pdf') {
      // Convert to HTML/PDF format
      const htmlContent = generatePDFHTML(spreadsheet.data, spreadsheet.headers, 'Spreadsheet Export', spreadsheet.metadata);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="spreadsheet_${id}.html"`);
      res.send(htmlContent);
    } else {
      res.status(400).json({
        error: 'Unsupported export format',
        supportedFormats: ['json', 'csv', 'xlsx', 'pdf'],
      });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Internal server error during export',
      message: error.message,
    });
  }
});

/**
 * Generate HTML content for PDF export
 */
function generatePDFHTML(data, headers, title, metadata) {
  const timestamp = new Date().toLocaleString();
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .metadata { margin-top: 30px; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="metadata">
        <p><strong>Exported:</strong> ${timestamp}</p>
        <p><strong>Rows:</strong> ${data.length}</p>
        <p><strong>Columns:</strong> ${headers.length}</p>
        ${metadata.fileName ? `<p><strong>Source:</strong> ${metadata.fileName}</p>` : ''}
    </div>
    <table>
        <thead>
            <tr>
  `;
  
  // Add headers
  headers.forEach(header => {
    html += `<th>${escapeHtml(header)}</th>`;
  });
  
  html += `
            </tr>
        </thead>
        <tbody>
  `;
  
  // Add data rows
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      const value = row[header] || '';
      html += `<td>${escapeHtml(value.toString())}</td>`;
    });
    html += '</tr>';
  });
  
  html += `
        </tbody>
    </table>
</body>
</html>`;
  
  return html;
}

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate spreadsheet data
 */
app.post('/api/spreadsheet/validate', (req, res) => {
  try {
    const { data, headers, validationRules = {} } = req.body;
    
    // Basic validation
    const basicValidation = validateSpreadsheetData(data);
    if (!basicValidation.isValid) {
      return res.status(400).json({
        isValid: false,
        errors: basicValidation.errors,
      });
    }
    
    // Advanced validation based on rules
    const advancedErrors = [];
    
    // Check for required columns
    if (validationRules.requiredColumns) {
      validationRules.requiredColumns.forEach(column => {
        if (!headers.includes(column)) {
          advancedErrors.push(`Required column '${column}' is missing`);
        }
      });
    }
    
    // Check data types
    if (validationRules.columnTypes) {
      Object.entries(validationRules.columnTypes).forEach(([column, expectedType]) => {
        if (headers.includes(column)) {
          data.forEach((row, index) => {
            const value = row[column];
            if (value !== null && value !== undefined) {
              const actualType = typeof value;
              if (actualType !== expectedType) {
                advancedErrors.push(`Row ${index + 1}: Column '${column}' should be ${expectedType}, but got ${actualType}`);
              }
            }
          });
        }
      });
    }
    
    res.json({
      isValid: advancedErrors.length === 0,
      errors: [...basicValidation.errors, ...advancedErrors],
      summary: {
        totalRows: data.length,
        totalColumns: headers.length,
        validRows: data.length - advancedErrors.filter(e => e.includes('Row')).length,
      },
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Internal server error during validation',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      message: error.message,
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Spreadsheet API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
