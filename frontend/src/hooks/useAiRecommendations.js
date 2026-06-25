import { useEffect, useState } from 'react';
import {
  fetchOutfitCombos,
  fetchPersonalizedRecommendations,
  fetchRecommendationQuery,
} from '../services/aiRecommendationService';

export function useAiRecommendations({ autoLoadPersonalized = false, personalizedLimit = 6, currentUserId = null } = {}) {
  const [personalized, setPersonalized] = useState({ items: [], profileSummary: '', fallbackUsed: true, queryText: '' });
  const [queryResult, setQueryResult] = useState({ items: [], profileSummary: '', fallbackUsed: true, queryText: '' });
  const [outfitCombos, setOutfitCombos] = useState({ items: [], anchorLabel: '', fallbackUsed: true });
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [isLoadingCombo, setIsLoadingCombo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!autoLoadPersonalized || !currentUserId) return undefined;

    let isMounted = true;
    setIsLoadingPersonalized(true);
    setError('');

    fetchPersonalizedRecommendations(personalizedLimit)
      .then((response) => {
        if (!isMounted) return;
        setPersonalized(response);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Khong the tai goi y ca nhan hoa.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPersonalized(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [autoLoadPersonalized, currentUserId, personalizedLimit]);

  const submitAiQuery = async (payload) => {
    setIsLoadingQuery(true);
    setError('');

    try {
      const response = await fetchRecommendationQuery(payload);
      setQueryResult(response);
      return response;
    } catch (requestError) {
      setError(requestError.message || 'Khong the lay goi y AI.');
      throw requestError;
    } finally {
      setIsLoadingQuery(false);
    }
  };

  const loadOutfitCombos = async (payload) => {
    setIsLoadingCombo(true);
    setError('');

    try {
      const response = await fetchOutfitCombos(payload);
      setOutfitCombos(response);
      return response;
    } catch (requestError) {
      setError(requestError.message || 'Khong the tai goi y combo.');
      throw requestError;
    } finally {
      setIsLoadingCombo(false);
    }
  };

  return {
    personalized,
    queryResult,
    outfitCombos,
    isLoadingPersonalized,
    isLoadingQuery,
    isLoadingCombo,
    error,
    submitAiQuery,
    loadOutfitCombos,
  };
}
