export const exportUtils = {
  /**
   * Export data to Excel format
   */
  exportToExcel(data, filename = 'export') {
    const headers = Object.keys(data?.[0] || {});
    const csvContent = [
      headers?.join(','),
      ...data?.map(row => 
        headers?.map(header => {
          const value = row?.[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value?.includes(',') || value?.includes('"'))) {
            return `"${value?.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })?.join(',')
      )
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link?.setAttribute('href', url);
    link?.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
  },

  /**
   * Export data to CSV format
   */
  exportToCSV(data, filename = 'export') {
    this.exportToExcel(data, filename); // CSV is same as Excel export
  },

  /**
   * Export data to PDF format
   */
  exportToPDF(data, filename = 'export') {
    // Create HTML table
    const headers = Object.keys(data?.[0] || {});
    const tableHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4a5568; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            h1 { color: #2d3748; }
          </style>
        </head>
        <body>
          <h1>${filename}</h1>
          <p>Generated on: ${new Date()?.toLocaleString()}</p>
          <table>
            <thead>
              <tr>${headers?.map(h => `<th>${h}</th>`)?.join('')}</tr>
            </thead>
            <tbody>
              ${data?.map(row => `
                <tr>${headers?.map(h => `<td>${row?.[h] ?? ''}</td>`)?.join('')}</tr>
              `)?.join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow?.document?.write(tableHTML);
    printWindow?.document?.close();
    printWindow?.print();
  },

  /**
   * Format campaign data for export
   */
  formatCampaignData(campaigns, includeFields = []) {
    return campaigns?.map(campaign => {
      const formatted = {};
      
      if (includeFields?.includes('creator')) {
        formatted['Creator Name'] = campaign?.creators?.name || campaign?.creatorName || 'N/A';
        formatted['Instagram Handle'] = campaign?.creators?.username || campaign?.instagramHandle || 'N/A';
      }
      
      if (includeFields?.includes('campaign')) {
        formatted['Campaign Name'] = campaign?.name || campaign?.campaignName || 'N/A';
        formatted['Campaign ID'] = campaign?.id || campaign?.campaignId || 'N/A';
        formatted['Brand'] = campaign?.brand || 'N/A';
      }
      
      if (includeFields?.includes('amount')) {
        formatted['Amount'] = campaign?.amount || campaign?.agreed_amount || 0;
      }
      
      if (includeFields?.includes('dueDate')) {
        formatted['Due Date'] = campaign?.end_date || campaign?.dueDate || 'N/A';
      }
      
      if (includeFields?.includes('status')) {
        formatted['Payment Status'] = campaign?.payment_status || campaign?.status || 'N/A';
      }
      
      if (includeFields?.includes('reference')) {
        formatted['Reference Number'] = campaign?.referenceNumber || 'N/A';
      }
      
      if (includeFields?.includes('method')) {
        formatted['Payment Method'] = campaign?.paymentMethod || 'N/A';
      }
      
      return formatted;
    });
  },

  /**
   * Format creator data for export
   */
  formatCreatorData(creators) {
    return creators?.map(creator => ({
      'Sr No': creator?.sr_no || 'N/A',
      'Name': creator?.name || 'N/A',
      'Instagram Link': creator?.instagram_link || 'N/A',
      'Followers Tier': creator?.followers_tier || 'N/A',
      'State': creator?.state || 'N/A',
      'City': creator?.city || 'N/A',
      'WhatsApp': creator?.whatsapp || 'N/A',
      'Email': creator?.email || 'N/A',
      'Gender': creator?.gender || 'N/A',
      'Username': creator?.username || 'N/A',
      'Sheet Source': creator?.sheet_source || 'N/A'
    }));
  }
};