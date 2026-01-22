import React from 'react';
import Icon from '../../../components/AppIcon';


const OverviewTab = ({ creator }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Instagram" size={20} color="var(--color-primary)" />
            <h3 className="text-lg font-semibold text-foreground">Instagram Metrics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Followers</span>
              <span className="text-sm font-medium text-foreground">{creator?.followersCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Engagement Rate</span>
              <span className="text-sm font-medium text-success">{creator?.engagementRate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Likes</span>
              <span className="text-sm font-medium text-foreground">{creator?.avgLikes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Comments</span>
              <span className="text-sm font-medium text-foreground">{creator?.avgComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Synced</span>
              <span className="text-xs text-muted-foreground">{creator?.lastSynced}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="User" size={20} color="var(--color-primary)" />
            <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Email</span>
              <a href={`mailto:${creator?.email}`} className="text-sm text-primary hover:underline">
                {creator?.email}
              </a>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Phone</span>
              <a href={`tel:${creator?.phone}`} className="text-sm text-foreground hover:text-primary">
                {creator?.phone}
              </a>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Manager</span>
              <span className="text-sm text-foreground">{creator?.manager}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Manager Contact</span>
              <a href={`tel:${creator?.managerPhone}`} className="text-sm text-foreground hover:text-primary">
                {creator?.managerPhone}
              </a>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="UserCircle" size={20} color="var(--color-primary)" />
            <h3 className="text-lg font-semibold text-foreground">Demographics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gender</span>
              <span className="text-sm font-medium text-foreground">{creator?.gender}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Age</span>
              <span className="text-sm font-medium text-foreground">{creator?.age}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">City</span>
              <span className="text-sm font-medium text-foreground">{creator?.city}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">State</span>
              <span className="text-sm font-medium text-foreground">{creator?.state}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Language</span>
              <span className="text-sm font-medium text-foreground">{creator?.language}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="IndianRupee" size={20} color="var(--color-primary)" />
          <h3 className="text-lg font-semibold text-foreground">Pricing Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deliverable Type</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Base Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Current Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {creator?.pricingMatrix?.map((item, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="py-3 px-4 text-sm text-foreground">{item?.type}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground text-right line-through">
                    ₹{item?.basePrice?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-foreground text-right">
                    ₹{item?.currentPrice?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground text-right">
                    {item?.lastUpdated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Tag" size={20} color="var(--color-primary)" />
          <h3 className="text-lg font-semibold text-foreground">Tags & Categories</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {creator?.tags?.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-muted text-foreground text-sm rounded-full border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;