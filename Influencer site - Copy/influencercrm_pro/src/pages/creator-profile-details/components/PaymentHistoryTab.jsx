import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PaymentHistoryTab = ({ payments }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-success/10 text-success border-success/20';
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Overdue':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const totalPaid = payments?.filter(p => p?.status === 'Paid')?.reduce((sum, p) => sum + p?.amount, 0);

  const totalPending = payments?.filter(p => p?.status === 'Pending' || p?.status === 'Overdue')?.reduce((sum, p) => sum + p?.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="CheckCircle" size={20} color="var(--color-success)" />
            <span className="text-sm text-muted-foreground">Total Paid</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">
            ₹{totalPaid?.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Clock" size={20} color="var(--color-warning)" />
            <span className="text-sm text-muted-foreground">Total Pending</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">
            ₹{totalPending?.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Receipt" size={20} color="var(--color-primary)" />
            <span className="text-sm text-muted-foreground">Total Transactions</span>
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {payments?.length}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Timeline</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Complete financial transaction history
          </p>
        </div>
        <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
          Export
        </Button>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment Mode</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reference</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Delay</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment) => (
                <tr key={payment?.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-sm text-foreground">{payment?.date}</div>
                    <div className="text-xs text-muted-foreground">{payment?.time}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-foreground">{payment?.campaignName}</div>
                    <div className="text-xs text-muted-foreground">{payment?.brandName}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                    ₹{payment?.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Icon name={payment?.modeIcon} size={16} color="var(--color-muted-foreground)" />
                      <span className="text-sm text-foreground">{payment?.mode}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-foreground">{payment?.reference}</div>
                    {payment?.utrNumber && (
                      <div className="text-xs text-muted-foreground">UTR: {payment?.utrNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(payment?.status)}`}>
                      {payment?.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {payment?.delayDays > 0 ? (
                      <span className="text-xs text-error font-medium">
                        {payment?.delayDays} days
                      </span>
                    ) : (
                      <span className="text-xs text-success">On Time</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTab;