import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const PaymentTableRow = ({ payment, isSelected, onSelect, onUpdate, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReference, setEditedReference] = useState(payment?.referenceNumber);
  const [editedStatus, setEditedStatus] = useState(payment?.status);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      processing: 'primary',
      paid: 'success',
      overdue: 'error'
    };
    return colors?.[status] || 'secondary';
  };

  const getDelayColor = (days) => {
    if (days === 0) return 'text-muted-foreground';
    if (days <= 3) return 'text-warning';
    if (days <= 7) return 'text-error';
    return 'text-error font-bold';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSave = () => {
    onUpdate(payment?.id, {
      referenceNumber: editedReference,
      status: editedStatus
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedReference(payment?.referenceNumber);
    setEditedStatus(payment?.status);
    setIsEditing(false);
  };

  return (
    <tr className={`border-b border-border hover:bg-muted/50 transition-colors duration-200 ${isSelected ? 'bg-primary/5' : ''}`}>
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(payment?.id, e?.target?.checked)}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{payment?.creatorName}</span>
          <span className="text-xs text-muted-foreground">{payment?.instagramHandle}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{payment?.campaignName}</span>
          <span className="text-xs text-muted-foreground">#{payment?.campaignId}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{formatAmount(payment?.amount)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{formatDate(payment?.dueDate)}</span>
          {payment?.delayDays > 0 && (
            <span className={`text-xs ${getDelayColor(payment?.delayDays)}`}>
              {payment?.delayDays} day{payment?.delayDays !== 1 ? 's' : ''} overdue
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-foreground">{payment?.paymentMethod}</span>
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="w-32">
            <Select
              options={statusOptions}
              value={editedStatus}
              onChange={setEditedStatus}
            />
          </div>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${getStatusColor(payment?.status)}/10 text-${getStatusColor(payment?.status)} border border-${getStatusColor(payment?.status)}/20`}>
            {payment?.status?.charAt(0)?.toUpperCase() + payment?.status?.slice(1)}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            type="text"
            value={editedReference}
            onChange={(e) => setEditedReference(e?.target?.value)}
            placeholder="Enter reference"
          />
        ) : (
          <span className="text-sm text-foreground">{payment?.referenceNumber || '-'}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {payment?.gatewaySync && (
            <div className="flex items-center gap-1" title="Payment gateway synced">
              <Icon name="CheckCircle" size={16} color="var(--color-success)" />
            </div>
          )}
          {payment?.bankReconciled && (
            <div className="flex items-center gap-1" title="Bank reconciled">
              <Icon name="Building" size={16} color="var(--color-primary)" />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="xs"
                iconName="Check"
                onClick={handleSave}
                aria-label="Save changes"
              />
              <Button
                variant="ghost"
                size="xs"
                iconName="X"
                onClick={handleCancel}
                aria-label="Cancel editing"
              />
            </>
          ) : (
            <>
              {(userRole === 'Super Admin' || userRole === 'Manager') && (
                <Button
                  variant="ghost"
                  size="xs"
                  iconName="Edit"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit payment"
                />
              )}
              <Button
                variant="ghost"
                size="xs"
                iconName="Upload"
                onClick={() => onUpdate(payment?.id, { action: 'upload_receipt' })}
                aria-label="Upload receipt"
              />
              <Button
                variant="ghost"
                size="xs"
                iconName="Bell"
                onClick={() => onUpdate(payment?.id, { action: 'notify_creator' })}
                aria-label="Notify creator"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PaymentTableRow;