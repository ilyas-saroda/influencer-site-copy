/**
 * Performance Score Calculation Utility
 * Calculates a performance score (0-10) for creators based on various metrics
 */

/**
 * Calculate performance score for a creator
 * @param {Object} creator - Creator object with engagement_rate, avg_likes, avg_comments, manual_performance_score
 * @param {Array} campaigns - Array of campaigns for this creator
 * @param {Array} payments - Array of payments for this creator
 * @returns {Object} Performance score object with { score, isManual }
 */
export const calculatePerformanceScore = (creator, campaigns = [], payments = []) => {
  // Check if manual score is set (takes priority)
  const manualScore = creator?.manual_performance_score !== null && creator?.manual_performance_score !== undefined
    ? parseFloat(creator.manual_performance_score)
    : null;

  if (manualScore !== null && !isNaN(manualScore)) {
    return {
      score: Math.min(10, Math.max(0, Math.round(manualScore * 10) / 10)),
      isManual: true
    };
  }

  // Calculate automatic score if no manual score
  let score = 0;
  const maxScore = 10;

  // 1. Engagement Rate (0-3 points)
  // Normalize engagement rate: 0% = 0 points, 5%+ = 3 points
  // Handle both snake_case and camelCase, and percentage strings
  let engagementRate = 0;
  if (creator?.engagement_rate) {
    engagementRate = typeof creator.engagement_rate === 'string' 
      ? parseFloat(creator.engagement_rate.replace('%', '')) 
      : parseFloat(creator.engagement_rate);
  } else if (creator?.engagementRate) {
    engagementRate = typeof creator.engagementRate === 'string' 
      ? parseFloat(creator.engagementRate.replace('%', '')) 
      : parseFloat(creator.engagementRate);
  }
  const engagementScore = Math.min(3, (engagementRate / 5) * 3);
  score += engagementScore;

  // 2. Campaign Completion Rate (0-3 points)
  // 100% completion = 3 points, 0% = 0 points
  const totalCampaigns = campaigns?.length || 0;
  const completedCampaigns = campaigns?.filter(c => 
    c?.status === 'completed' || 
    c?.payment_status === 'paid' ||
    c?.payment_status === 'Paid'
  )?.length || 0;
  const completionRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) : 0;
  const completionScore = completionRate * 3;
  score += completionScore;

  // 3. Payment Completion Rate (0-2 points)
  // 100% paid = 2 points, 0% = 0 points
  const totalPayments = payments?.length || campaigns?.length || 0;
  const paidPayments = payments?.filter(p => 
    p?.status === 'Paid' || 
    p?.status === 'paid'
  )?.length || campaigns?.filter(c => 
    c?.payment_status === 'paid' || 
    c?.payment_status === 'Paid'
  )?.length || 0;
  const paymentRate = totalPayments > 0 ? (paidPayments / totalPayments) : 0;
  const paymentScore = paymentRate * 2;
  score += paymentScore;

  // 4. Average Engagement Metrics (0-2 points)
  // Based on avg_likes and avg_comments
  // Handle both snake_case and camelCase, and formatted numbers with commas
  let avgLikes = 0;
  if (creator?.avg_likes) {
    avgLikes = typeof creator.avg_likes === 'string' 
      ? parseFloat(creator.avg_likes.replace(/,/g, '')) 
      : parseFloat(creator.avg_likes);
  } else if (creator?.avgLikes) {
    avgLikes = typeof creator.avgLikes === 'string' 
      ? parseFloat(creator.avgLikes.replace(/,/g, '')) 
      : parseFloat(creator.avgLikes);
  }
  
  let avgComments = 0;
  if (creator?.avg_comments) {
    avgComments = typeof creator.avg_comments === 'string' 
      ? parseFloat(creator.avg_comments.replace(/,/g, '')) 
      : parseFloat(creator.avg_comments);
  } else if (creator?.avgComments) {
    avgComments = typeof creator.avgComments === 'string' 
      ? parseFloat(creator.avgComments.replace(/,/g, '')) 
      : parseFloat(creator.avgComments);
  }
  
  // Normalize: High engagement (10k+ likes, 100+ comments) = 2 points
  const likesScore = Math.min(1, avgLikes / 10000);
  const commentsScore = Math.min(1, avgComments / 100);
  const engagementMetricsScore = (likesScore + commentsScore) / 2 * 2;
  score += engagementMetricsScore;

  // Round to 1 decimal place and ensure it's between 0 and 10
  return {
    score: Math.min(maxScore, Math.max(0, Math.round(score * 10) / 10)),
    isManual: false
  };
};

/**
 * Calculate performance metrics for multiple creators
 * @param {Array} creators - Array of creator objects
 * @param {Array} allCampaigns - Array of all campaigns
 * @returns {Array} Creators with performance scores and metrics
 */
export const calculateCreatorsPerformance = (creators = [], allCampaigns = []) => {
  return creators.map(creator => {
    // Get campaigns for this creator
    const creatorCampaigns = allCampaigns?.filter(c => 
      c?.creator_id === creator?.id || 
      c?.creators?.id === creator?.id ||
      c?.creator?.id === creator?.id
    ) || [];

    // Extract payments from campaigns
    const payments = creatorCampaigns
      ?.filter(c => c?.amount || c?.agreed_amount)
      ?.map(campaign => ({
        id: campaign?.id,
        amount: campaign?.amount || campaign?.agreed_amount || 0,
        status: campaign?.payment_status || 'Pending'
      })) || [];

    const performanceResult = calculatePerformanceScore(creator, creatorCampaigns, payments);
    const performanceScore = performanceResult.score;
    const isManualScore = performanceResult.isManual;

    return {
      ...creator,
      performanceScore,
      isManualScore,
      totalCampaigns: creatorCampaigns.length,
      completedCampaigns: creatorCampaigns.filter(c => 
        c?.status === 'completed' || 
        c?.payment_status === 'paid' ||
        c?.payment_status === 'Paid'
      ).length,
      totalEarned: payments
        .filter(p => p?.status === 'Paid' || p?.status === 'paid')
        .reduce((sum, p) => sum + (p?.amount || 0), 0)
    };
  });
};

/**
 * Get top performers sorted by performance score
 * @param {Array} creators - Array of creators with performance scores
 * @param {number} limit - Number of top performers to return
 * @returns {Array} Top performers sorted by performance score
 */
export const getTopPerformers = (creators = [], limit = 6) => {
  return creators
    .sort((a, b) => {
      // Sort by performance score (descending)
      if (b.performanceScore !== a.performanceScore) {
        return b.performanceScore - a.performanceScore;
      }
      // If scores are equal, sort by engagement rate
      let aEngagement = 0;
      if (a?.engagement_rate) {
        aEngagement = typeof a.engagement_rate === 'string' 
          ? parseFloat(a.engagement_rate.replace('%', '')) 
          : parseFloat(a.engagement_rate);
      }
      
      let bEngagement = 0;
      if (b?.engagement_rate) {
        bEngagement = typeof b.engagement_rate === 'string' 
          ? parseFloat(b.engagement_rate.replace('%', '')) 
          : parseFloat(b.engagement_rate);
      }
      
      return bEngagement - aEngagement;
    })
    .slice(0, limit);
};

