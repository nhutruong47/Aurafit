import { useEffect, useState } from 'react';
import { fetchActiveEvents } from '../services/eventService';

export function useActiveEvents(limit = 3) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetchActiveEvents()
      .then((response) => {
        if (!isMounted) return;

        setEvents(Array.isArray(response) ? response.slice(0, limit) : []);
        setError('');
      })
      .catch((requestError) => {
        if (!isMounted) return;

        setEvents([]);
        setError(requestError.message || 'Không thể tải sự kiện đang diễn ra.');
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
