import React from 'react';
import Icon from '../../../components/AppIcon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceHistoryTab = ({ priceHistory }) => {
  const chartData = priceHistory?.map(item => ({
    date: item?.date,
    'Instagram Post': item?.instagramPost,
    'Instagram Reel': item?.instagramReel,
    'Instagram Story': item?.instagramStory
  }));

  const latestPrices = priceHistory?.[priceHistory?.length - 1];
  const oldestPrices = priceHistory?.[0];

  const calculateChange = (current, old) => {
    const change = ((current - old) / old) * 100;
    return change?.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Instagram Post</span>
            <Icon name="Image" size={18} color="var(--color-primary)" />
          </div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            ₹{latestPrices?.instagramPost?.toLocaleString('en-IN')}
          </div>
          <div className={`text-xs font-medium ${
            calculateChange(latestPrices?.instagramPost, oldestPrices?.instagramPost) >= 0
              ? 'text-success' :'text-error'
          }`}>
            {calculateChange(latestPrices?.instagramPost, oldestPrices?.instagramPost) >= 0 ? '+' : ''}
            {calculateChange(latestPrices?.instagramPost, oldestPrices?.instagramPost)}% from initial
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Instagram Reel</span>
            <Icon name="Video" size={18} color="var(--color-primary)" />
          </div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            ₹{latestPrices?.instagramReel?.toLocaleString('en-IN')}
          </div>
          <div className={`text-xs font-medium ${
            calculateChange(latestPrices?.instagramReel, oldestPrices?.instagramReel) >= 0
              ? 'text-success' :'text-error'
          }`}>
            {calculateChange(latestPrices?.instagramReel, oldestPrices?.instagramReel) >= 0 ? '+' : ''}
            {calculateChange(latestPrices?.instagramReel, oldestPrices?.instagramReel)}% from initial
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Instagram Story</span>
            <Icon name="Sparkles" size={18} color="var(--color-primary)" />
          </div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            ₹{latestPrices?.instagramStory?.toLocaleString('en-IN')}
          </div>
          <div className={`text-xs font-medium ${
            calculateChange(latestPrices?.instagramStory, oldestPrices?.instagramStory) >= 0
              ? 'text-success' :'text-error'
          }`}>
            {calculateChange(latestPrices?.instagramStory, oldestPrices?.instagramStory) >= 0 ? '+' : ''}
            {calculateChange(latestPrices?.instagramStory, oldestPrices?.instagramStory)}% from initial
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Icon name="TrendingUp" size={20} color="var(--color-primary)" />
          <h3 className="text-lg font-semibold text-foreground">Price Evolution Chart</h3>
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px'
                }}
                formatter={(value) => `₹${value?.toLocaleString('en-IN')}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Instagram Post" 
                stroke="#2563EB" 
                strokeWidth={2}
                dot={{ fill: '#2563EB', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Instagram Reel" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Instagram Story" 
                stroke="#059669" 
                strokeWidth={2}
                dot={{ fill: '#059669', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="FileText" size={20} color="var(--color-primary)" />
          <h3 className="text-lg font-semibold text-foreground">Negotiation History</h3>
        </div>
        <div className="space-y-4">
          {priceHistory?.map((item, index) => (
            <div key={index} className="border-l-2 border-primary pl-4 pb-4 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-foreground">{item?.date}</div>
                  <div className="text-xs text-muted-foreground">{item?.updatedBy}</div>
                </div>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                  {item?.reason}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{item?.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryTab;