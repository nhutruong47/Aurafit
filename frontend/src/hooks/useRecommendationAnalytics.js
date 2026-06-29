import { useEffect, useState } from 'react';
import { fetchRecommendationAnalytics } from '../services/recommendationAnalyticsService';
import { hasUserRole } from '../utils/roles';

export function useRecommendationAnalytics(currentUser) {
  const [analytics, setAnalytics] = useState(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = hasUserRole(currentUser, 'ADMIN');

  useEffect(() => {
    if (!isAdmin) {
      setAnalytics(null);
      setError('');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchRecommendationAnalytics(periodDays)
      .then((payload) => {
        if (!isMounted) return;
        setAnalytics(payload || null);
      })
      .catch((nextError) => {
        if (!isMounted) return;
        setError(nextError.message || 'Không thể tải báo cáo AI recommendation.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin, periodDays]);

  return {
    analytics,
    periodDays,
    isLoading,
    error,
    setPeriodDays,
  };
}
