import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { exportUtils } from '../../../utils/exportUtils';
import { exportLogService } from '../../../services/exportLogService';
import { useAuth } from '../../../contexts/AuthContext';

const ExportReportModal = ({ isOpen, onClose, onExport, payments = [] }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'excel',
    dateFrom: '',
    dateTo: '',
    includeStatus: ['pending', 'processing', 'paid', 'overdue'],
    includeFields: ['creator', 'campaign', 'amount', 'dueDate', 'status', 'reference']
  });
  const { user } = useAuth();

  const formatOptions = [
    { value: 'excel', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV (.csv)' },
    { value: 'pdf', label: 'PDF Report' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const fieldOptions = [
    { value: 'creator', label: 'Creator Details' },
    { value: 'campaign', label: 'Campaign Information' },
    { value: 'amount', label: 'Payment Amount' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'status', label: 'Payment Status' },
    { value: 'reference', label: 'Reference Number' },
    { value: 'method', label: 'Payment Method' },
    { value: 'integration', label: 'Integration Status' }
  ];

  const handleStatusToggle = (status) => {
    setExportConfig(prev => ({
      ...prev,
      includeStatus: prev?.includeStatus?.includes(status)
        ? prev?.includeStatus?.filter(s => s !== status)
        : [...prev?.includeStatus, status]
    }));
  };

  const handleFieldToggle = (field) => {
    setExportConfig(prev => ({
      ...prev,
      includeFields: prev?.includeFields?.includes(field)
        ? prev?.includeFields?.filter(f => f !== field)
        : [...prev?.includeFields, field]
    }));
  };

  const handleExport = async () => {
    try {
      // Get payments to export
      const paymentsToExport = payments?.length > 0 ? payments : [];
      
      if (paymentsToExport?.length === 0) {
        alert('No payment data to export');
        return;
      }

      // Format data based on config
      const formattedData = exportUtils?.formatCampaignData(
        paymentsToExport,
        exportConfig?.includeFields
      );

      // Apply date filtering if specified
      let filteredData = formattedData;
      if (exportConfig?.dateFrom || exportConfig?.dateTo) {
        filteredData = formattedData?.filter((_, index) => {
          const payment = paymentsToExport?.[index];
          const paymentDate = new Date(payment?.dueDate);
          
          if (exportConfig?.dateFrom && paymentDate < new Date(exportConfig?.dateFrom)) {
            return false;
          }
          if (exportConfig?.dateTo && paymentDate > new Date(exportConfig?.dateTo)) {
            return false;
          }
          return true;
        });
      }

      // Generate filename with timestamp
      const timestamp = new Date()?.toISOString()?.slice(0, 10);
      const filename = `payment-report-${timestamp}`;

      // Export based on format
      switch (exportConfig?.format) {
        case 'excel':
          exportUtils?.exportToExcel(filteredData, filename);
          break;
        case 'csv':
          exportUtils?.exportToCSV(filteredData, filename);
          break;
        case 'pdf':
          exportUtils?.exportToPDF(filteredData, filename);
          break;
        default:
          exportUtils?.exportToExcel(filteredData, filename);
      }

      // Log the export activity
      const username = user?.email || 'Unknown User';
      const dateRange = (exportConfig?.dateFrom || exportConfig?.dateTo) 
        ? ` ${exportConfig?.dateFrom || ''} to ${exportConfig?.dateTo || ''}` 
        : '';
      
      await exportLogService?.logExport({
        username,
        exportType: exportConfig?.format,
        exportScope: 'filtered',
        recordCount: filteredData?.length,
        fileName: `${filename}.${exportConfig?.format === 'excel' ? 'xlsx' : exportConfig?.format}`,
        additionalDetails: `Payment Report Export${dateRange} - Fields: ${exportConfig?.includeFields?.join(', ')} - Status: ${exportConfig?.includeStatus?.join(', ')}`
      });

      onExport?.(exportConfig);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      
      // Log the export failure
      try {
        const username = user?.email || 'Unknown User';
        await exportLogService?.logExport({
          username,
          exportType: exportConfig?.format,
          exportScope: 'filtered',
          recordCount: 0,
          fileName: '',
          additionalDetails: `Payment Report Export Failed - ${error?.message || 'Unknown error'}`
        });
      } catch (logError) {
        console.error('Failed to log export error:', logError);
      }
      
      alert(`Failed to export report: ${error?.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4">
      <div className="bg-card rounded-lg shadow-lg-custom max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Download" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Export Payment Report</h2>
              <p className="text-xs text-muted-foreground">Configure your export settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors duration-200"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Export Format
            </label>
            <Select
              options={formatOptions}
              value={exportConfig?.format}
              onChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="From Date"
              value={exportConfig?.dateFrom}
              onChange={(e) => setExportConfig(prev => ({ ...prev, dateFrom: e?.target?.value }))}
            />
            <Input
              type="date"
              label="To Date"
              value={exportConfig?.dateTo}
              onChange={(e) => setExportConfig(prev => ({ ...prev, dateTo: e?.target?.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Include Payment Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions?.map((status) => (
                <Checkbox
                  key={status?.value}
                  label={status?.label}
                  checked={exportConfig?.includeStatus?.includes(status?.value)}
                  onChange={() => handleStatusToggle(status?.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Include Fields
            </label>
            <div className="grid grid-cols-2 gap-3">
              {fieldOptions?.map((field) => (
                <Checkbox
                  key={field?.value}
                  label={field?.label}
                  checked={exportConfig?.includeFields?.includes(field?.value)}
                  onChange={() => handleFieldToggle(field?.value)}
                />
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Export Information</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Excel format includes formatting and formulas</li>
                  <li>• CSV format is compatible with all spreadsheet applications</li>
                  <li>• PDF format generates a formatted report document</li>
                  <li>• All exports include timestamp and user information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            iconName="Download"
            iconPosition="left"
            onClick={handleExport}
          >
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;