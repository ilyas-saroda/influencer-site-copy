import React from 'react';
import Icon from '../../../components/AppIcon';
import PaymentTableRow from './PaymentTableRow';
import { Checkbox } from '../../../components/ui/Checkbox';

const PaymentTable = ({ 
  payments, 
  selectedPayments, 
  onSelectAll, 
  onSelectPayment, 
  onUpdatePayment,
  sortConfig,
  onSort,
  userRole 
}) => {
  const columns = [
    { key: 'select', label: '', sortable: false, width: '50px' },
    { key: 'creator', label: 'Creator', sortable: true },
    { key: 'campaign', label: 'Campaign', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'paymentMethod', label: 'Method', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'reference', label: 'Reference', sortable: false },
    { key: 'integration', label: 'Integration', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '150px' }
  ];

  const handleSort = (key) => {
    if (columns?.find(col => col?.key === key)?.sortable) {
      onSort(key);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return 'ChevronsUpDown';
    return sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown';
  };

  const allSelected = payments?.length > 0 && payments?.every(p => selectedPayments?.includes(p?.id));
  const someSelected = payments?.some(p => selectedPayments?.includes(p?.id)) && !allSelected;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full">
        <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
          <tr>
            {columns?.map((column) => (
              <th
                key={column?.key}
                className={`px-4 py-3 text-left ${column?.width ? `w-[${column?.width}]` : ''}`}
              >
                {column?.key === 'select' ? (
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => onSelectAll(e?.target?.checked)}
                  />
                ) : (
                  <button
                    onClick={() => handleSort(column?.key)}
                    className={`flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider ${
                      column?.sortable ? 'hover:text-primary cursor-pointer' : 'cursor-default'
                    }`}
                    disabled={!column?.sortable}
                  >
                    {column?.label}
                    {column?.sortable && (
                      <Icon
                        name={getSortIcon(column?.key)}
                        size={14}
                        color={sortConfig?.key === column?.key ? 'var(--color-primary)' : 'var(--color-muted-foreground)'}
                      />
                    )}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments?.length === 0 ? (
            <tr>
              <td colSpan={columns?.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Icon name="FileX" size={48} color="var(--color-muted-foreground)" />
                  <p className="mt-3 text-sm text-muted-foreground">No payments found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your filters or create a new payment
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            payments?.map((payment) => (
              <PaymentTableRow
                key={payment?.id}
                payment={payment}
                isSelected={selectedPayments?.includes(payment?.id)}
                onSelect={onSelectPayment}
                onUpdate={onUpdatePayment}
                userRole={userRole}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;