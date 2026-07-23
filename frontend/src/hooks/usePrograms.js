import { useEffect, useState } from 'react';
import { fetchUpcomingAndActiveEvents } from '../services/eventService';

export function usePrograms(limit = 100) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetchUpcomingAndActiveEvents(limit)
      .then((response) => {
        if (!isMounted) return;

        setEvents(Array.isArray(response) ? response : []);
        setError('');
      })
      .catch((requestError) => {
        if (!isMounted) return;

        setEvents([]);
        setError(requestError.message || 'Không thể tải danh sách chương trình.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { events, isLoading, error };
}
