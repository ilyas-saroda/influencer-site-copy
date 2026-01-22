# Enterprise Spreadsheet Import & Export Feature

A comprehensive, production-ready spreadsheet import and export system for React + Node.js applications that provides automated Excel/CSV and Google Sheets integration with professional UI/UX and multi-format export capabilities.

## 🚀 Features

### Core Functionality
- **Excel/CSV Import**: Automated parsing of `.xlsx`, `.xls`, and `.csv` files
- **Google Sheets Integration**: Direct import from public Google Sheets via URL
- **Dynamic Data Display**: Professional, Excel-like table with sorting, filtering, and pagination
- **Universal Access**: Import buttons available on all pages via sidebar integration
- **Backend API**: RESTful endpoints for data persistence and processing

### Export Capabilities
- **Multi-Format Export**: CSV, Excel (.xlsx), JSON, and PDF (HTML) formats
- **Progress Tracking**: Real-time export progress indicators
- **Format Selection**: User-friendly format selection menu with descriptions
- **Large Dataset Support**: Efficient handling of up to 100,000 rows
- **Metadata Inclusion**: Automatic inclusion of export metadata and timestamps

### Enterprise Features
- **Fully Automated**: One-click import/export with no manual steps required
- **System Excel Integration**: Attempts to open files in system's default Excel application
- **Data Validation**: Comprehensive validation with meaningful error messages
- **Large File Support**: Handles files up to 50MB for import, 100k rows for export
- **Responsive Design**: Mobile-friendly with accessibility support
- **Error Handling**: Graceful handling of all error scenarios

## 📦 Installation

### Dependencies
```bash
npm install xlsx papaparse express cors helmet express-rate-limit multer
```

### File Structure
```
src/
├── components/ui/
│   ├── ExcelImportButton.jsx          # Excel/CSV import component
│   ├── GoogleSheetsImportButton.jsx   # Google Sheets import component
│   ├── SpreadsheetDataTable.jsx       # Dynamic data table display
│   └── SpreadsheetImportPanel.jsx    # Unified import interface
├── services/
│   ├── spreadsheetService.js          # Core spreadsheet operations
│   └── spreadsheetApiService.js       # Backend API integration
├── styles/
│   └── spreadsheet.css               # Professional styling
└── components/ui/Sidebar.jsx         # Updated with import buttons

server.js                              # Backend API server
```

## 🔧 Usage

### Frontend Integration

The import buttons are automatically integrated into the sidebar and available on all pages. Users can:

1. Click "Import Excel" to upload local Excel/CSV files
2. Click "Import Google Sheet" to connect to Google Sheets via URL
3. View imported data in a professional table interface
4. Export data in various formats

### Backend Server

Start the backend API server:

```bash
node server.js
```

The server will run on `http://localhost:3001` with the following endpoints:

- `GET /api/health` - Health check
- `POST /api/spreadsheet/import` - Import spreadsheet data
- `GET /api/spreadsheet/list` - List saved spreadsheets
- `GET /api/spreadsheet/:id` - Get specific spreadsheet
- `PUT /api/spreadsheet/:id` - Update spreadsheet
- `DELETE /api/spreadsheet/:id` - Delete spreadsheet
- `GET /api/spreadsheet/:id/export` - Export spreadsheet

## 🎯 Key Components

### SpreadsheetService
Core service for spreadsheet operations:
- File parsing and validation
- Google Sheets data fetching
- Data type detection and formatting
- Export functionality

### ExcelImportButton
Reusable component for Excel/CSV import:
- Drag-and-drop support
- File validation
- Progress indicators
- Error handling

### GoogleSheetsImportButton
Component for Google Sheets integration:
- URL validation
- Real-time data fetching
- Permission error handling
- Help documentation

### SpreadsheetDataTable
Professional data display component:
- Dynamic column management
- Sorting and filtering
- Pagination
- Search functionality
- Export options

## 🔒 Security Features

- File type validation
- File size limits
- Rate limiting on API endpoints
- CORS configuration
- Input sanitization
- Authentication integration

## 📱 Responsive Design

- Mobile-friendly interface
- Touch-optimized controls
- Accessible ARIA labels
- High contrast mode support
- Reduced motion support

## 🎨 Styling

Professional enterprise styling with:
- Gradient backgrounds
- Smooth animations
- Hover effects
- Loading states
- Status indicators
- Dark mode support

## 🚀 Production Deployment

### Environment Variables
```env
REACT_APP_API_URL=https://your-api-domain.com/api
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001
NODE_ENV=production
```

### Database Integration
Replace the in-memory storage in `server.js` with your preferred database:

```javascript
// Example with MongoDB
const mongoose = require('mongoose');
const SpreadsheetSchema = new mongoose.Schema({
  data: [Object],
  headers: [String],
  metadata: Object,
  userId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

## 🔧 Customization

### Adding Custom Validation
```javascript
const validationRules = {
  requiredColumns: ['email', 'name'],
  columnTypes: {
    'email': 'string',
    'age': 'number'
  }
};

const result = await spreadsheetApiService.validateSpreadsheetData(data, validationRules);
```

### Custom Styling
Modify `src/styles/spreadsheet.css` to match your brand:

```css
.spreadsheet-import-btn {
  background: linear-gradient(135deg, #your-brand-color 0%, #your-brand-dark 100%);
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Google Sheets Permission Error**
   - Ensure the sheet is publicly accessible
   - Use "Publish to web" feature in Google Sheets

2. **Large File Processing**
   - Increase timeout in API service
   - Consider server-side processing for very large files

3. **CORS Issues**
   - Configure CORS settings in server.js
   - Update frontend API URL

### Error Messages

The system provides detailed error messages for:
- Invalid file formats
- Empty files/sheets
- Network connectivity issues
- Permission denied errors
- Data validation failures

## 📊 Performance

- Client-side file processing for privacy
- Efficient memory usage
- Lazy loading for large datasets
- Optimized rendering with React
- API response caching

## 🧪 Testing

```javascript
// Test Excel import
const testData = {
  data: [{ name: 'John', email: 'john@example.com' }],
  headers: ['name', 'email'],
  metadata: { fileName: 'test.xlsx' }
};

const result = await spreadsheetApiService.saveSpreadsheetData(testData);
```

## 📝 API Documentation

### Import Spreadsheet
```http
POST /api/spreadsheet/import
Content-Type: application/json

{
  "data": [...],
  "headers": [...],
  "metadata": {...},
  "userId": "user123"
}
```

### Response
```json
{
  "message": "Spreadsheet imported successfully",
  "spreadsheetId": "abc123",
  "record": {
    "id": "abc123",
    "rowCount": 100,
    "columnCount": 5,
    "metadata": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🤝 Contributing

1. Follow the existing code style
2. Add comprehensive error handling
3. Include accessibility features
4. Test with various file formats
5. Update documentation

## 📄 License

This feature is part of the enterprise CRM system and follows the same licensing terms.

---

**Note**: This is a production-ready implementation designed for enterprise use. All components include comprehensive error handling, validation, and security features.
