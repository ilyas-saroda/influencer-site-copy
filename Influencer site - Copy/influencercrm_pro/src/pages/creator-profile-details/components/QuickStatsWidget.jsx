import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { Edit2, Check, X, RotateCcw } from 'lucide-react';
import { creatorService } from '../../../services/creatorService';
import toast from 'react-hot-toast';

const QuickStatsWidget = ({ stats, creatorId, onScoreUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stats?.performanceScore?.toString() || '0');
  const [saving, setSaving] = useState(false);

  // Sync editValue when stats change
  useEffect(() => {
    if (!isEditing) {
      setEditValue(stats?.performanceScore?.toString() || '0');
    }
  }, [stats?.performanceScore, isEditing]);

  const handleSave = async () => {
    const score = parseFloat(editValue);
    
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error('Please enter a valid score between 0 and 10');
      return;
    }

    if (!creatorId) {
      toast.error('Creator ID is missing');
      return;
    }

    setSaving(true);
    try {
      await creatorService.updatePerformanceScore(creatorId, score);
      toast.success('Performance score updated successfully');
      setIsEditing(false);
      if (onScoreUpdate) {
        onScoreUpdate(score);
      }
    } catch (error) {
      console.error('Error updating performance score:', error);
      toast.error(error?.message || 'Failed to update performance score');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(stats?.performanceScore?.toString() || '0');
    setIsEditing(false);
  };

  const handleClearManual = async () => {
    if (!creatorId) {
      toast.error('Creator ID is missing');
      return;
    }

    setSaving(true);
    try {
      await creatorService.updatePerformanceScore(creatorId, null);
      toast.success('Manual score cleared. Using calculated score now.');
      if (onScoreUpdate) {
        onScoreUpdate(null);
      }
    } catch (error) {
      console.error('Error clearing manual score:', error);
      toast.error(error?.message || 'Failed to clear manual score');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Megaphone" size={18} color="var(--color-primary)" />
            <span className="text-sm text-muted-foreground">Total Campaigns</span>
          </div>
          <span className="text-lg font-semibold text-foreground">{stats?.totalCampaigns}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="CheckCircle" size={18} color="var(--color-success)" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <span className="text-lg font-semibold text-success">{stats?.completedCampaigns}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={18} color="var(--color-warning)" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <span className="text-lg font-semibold text-warning">{stats?.activeCampaigns}</span>
        </div>

        <div className="h-px bg-border my-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="IndianRupee" size={18} color="var(--color-primary)" />
            <span className="text-sm text-muted-foreground">Total Earned</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            ₹{stats?.totalEarned?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="TrendingUp" size={18} color="var(--color-success)" />
            <span className="text-sm text-muted-foreground">Avg. Per Campaign</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            ₹{stats?.avgPerCampaign?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="h-px bg-border my-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Star" size={18} color="var(--color-accent)" />
            <span className="text-sm text-muted-foreground">Performance Score</span>
            {stats?.isManualScore && (
              <span className="text-xs text-muted-foreground">(Manual)</span>
            )}
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-2 py-1 text-lg font-semibold text-accent border border-border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                autoFocus
              />
              <span className="text-lg font-semibold text-accent">/10</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-accent">{stats?.performanceScore}/10</span>
              {creatorId && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded transition-colors"
                    title="Edit Performance Score"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {stats?.isManualScore && (
                    <button
                      onClick={handleClearManual}
                      disabled={saving}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-warning/10 rounded transition-colors"
                      title="Clear manual score and use calculated score"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Calendar" size={18} color="var(--color-primary)" />
            <span className="text-sm text-muted-foreground">Member Since</span>
          </div>
          <span className="text-sm text-foreground">{stats?.memberSince}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsWidget;