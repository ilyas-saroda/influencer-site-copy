import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ProfileHeader = ({ creator, onEdit, onArchive, onAddToCampaign, onBack }) => {
  return (
    <div className="bg-card border-b border-border sticky top-16 z-50">
      <div className="px-6 py-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="ChevronLeft" size={16} />
            <span>Creator Database</span>
          </button>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
          <span className="text-foreground font-medium">Profile</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Image
                src={creator?.profileImage}
                alt={creator?.profileImageAlt}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
              />
              {creator?.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                  <Icon name="BadgeCheck" size={16} color="white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-semibold text-foreground truncate">
                  {creator?.name}
                </h1>
                {creator?.isPremium && (
                  <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full flex items-center gap-1">
                    <Icon name="Star" size={12} />
                    Premium
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <a
                  href={creator?.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Icon name="Instagram" size={16} />
                  {creator?.instagramHandle}
                </a>
                <span className="flex items-center gap-1">
                  <Icon name="MapPin" size={16} />
                  {creator?.city}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Users" size={16} />
                  {creator?.followersCount}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  creator?.status === 'Active' ?'bg-success/10 text-success border border-success/20' :'bg-muted text-muted-foreground border border-border'
                }`}>
                  {creator?.status}
                </span>
                {creator?.categories?.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              iconPosition="left"
              onClick={onEdit}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Archive"
              iconPosition="left"
              onClick={onArchive}
            >
              Archive
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="Plus"
              iconPosition="left"
              onClick={onAddToCampaign}
            >
              Add to Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;