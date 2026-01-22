import { useState, useEffect } from 'react';
import { creatorService } from '../services/creatorService';

export const useFollowersTiers = () => {
  const [followersTiers, setFollowersTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFollowersTiers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching followers tiers from database...');
        const uniqueFollowers = await creatorService.getUniqueValues('followers_tier');
        console.log('Raw followers tiers from database:', uniqueFollowers);
        
        // Define the desired order for followers tiers
        const desiredOrder = [
          '0-10k',
          '10K-50K', 
          '50K-100K',
          '100K-250K',
          '250K-500K',
          '500K-1M',
          '1M+',
          'Not Found'
        ];
        
        const followerOptions = uniqueFollowers
          .filter(follower => follower && follower.trim() !== '')
          .map(follower => {
            const normalizedValue = follower.trim();
            return {
              value: normalizedValue,
              label: normalizedValue
            };
          })
          .filter((option, index, self) => 
            index === self.findIndex((opt) => opt.value.toLowerCase() === option.value.toLowerCase())
          ) // Remove duplicates (case-insensitive)
          .sort((a, b) => {
            // Custom sorting based on desired order
            const aIndex = desiredOrder.findIndex(order => 
              order.toLowerCase() === a.value.toLowerCase()
            );
            const bIndex = desiredOrder.findIndex(order => 
              order.toLowerCase() === b.value.toLowerCase()
            );
            
            // If both items are in desired order, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            
            // If only one item is in desired order, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // If neither is in desired order, sort alphabetically
            return a.label.localeCompare(b.label);
          });
        
        // Add "Not Found" option for NULL values only if it doesn't already exist
        const hasNotFound = followerOptions.some(option => 
          option.value.toLowerCase() === 'not found'
        );
        if (!hasNotFound) {
          followerOptions.push({
            value: 'Not Found',
            label: 'Not Found'
          });
        }
        
        console.log('Processed follower options:', followerOptions);
        setFollowersTiers(followerOptions);
      } catch (err) {
        console.error('Error fetching followers tiers:', err);
        setError(err.message || 'Failed to fetch followers tiers');
        setFollowersTiers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowersTiers();
  }, []);

  return { followersTiers, loading, error };
};
