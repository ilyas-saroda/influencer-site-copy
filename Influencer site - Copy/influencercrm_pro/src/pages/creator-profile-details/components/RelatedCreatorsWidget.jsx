import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const RelatedCreatorsWidget = ({ creators }) => {
  const navigate = useNavigate();

  const handleCreatorClick = (creatorId) => {
    navigate('/creator-profile-details', { state: { creatorId } });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Similar Creators</h3>
      <div className="space-y-3">
        {creators?.map((creator) => (
          <button
            key={creator?.id}
            onClick={() => handleCreatorClick(creator?.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Image
              src={creator?.profileImage}
              alt={creator?.profileImageAlt}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-foreground truncate">
                {creator?.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {creator?.instagramHandle}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{creator?.followersCount}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{creator?.category}</span>
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedCreatorsWidget;