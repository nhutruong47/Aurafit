import { useEffect, useMemo, useState } from 'react';
import { fetchUpcomingAndActiveEvents } from '../services/eventService';

export function useFeaturedEvents(limit = 2) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetchUpcomingAndActiveEvents(limit)
      .then((response) => {
        if (isMounted) {
          setEvents(Array.isArray(response) ? response.slice(0, limit) : []);
        }
      })
      .catch(() => {
        if (isMounted) setEvents([]);
      });

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return useMemo(() => ({
    events,
    leftEvent: events[0] || null,
    rightEvent: events.length === 1 ? events[0] : events[1] || null,
  }), [events]);
}
