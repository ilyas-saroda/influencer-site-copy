import React from 'react';
import Icon from '../../../components/AppIcon';

const TabNavigation = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="bg-card border-b border-border sticky top-[136px] z-40">
      <div className="px-6">
        <nav className="flex gap-1" role="tablist">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => onTabChange(tab?.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab?.id
                  ? 'text-primary border-primary' :'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
              role="tab"
              aria-selected={activeTab === tab?.id}
              aria-controls={`${tab?.id}-panel`}
            >
              <Icon name={tab?.icon} size={18} />
              <span>{tab?.label}</span>
              {tab?.badge && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {tab?.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;