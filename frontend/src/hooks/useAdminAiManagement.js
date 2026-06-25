import { useEffect, useMemo, useState } from 'react';
import {
  createFashionTrend,
  fetchAdminProductAiMetadata,
  fetchFashionTrends,
  updateAdminProductAiMetadata,
  updateFashionTrend,
} from '../services/aiRecommendationService';
import { hasUserRole } from '../utils/roles';

const emptyMetadataForm = {
  styleTags: '',
  occasionTags: '',
  trendTags: '',
  sizeTags: '',
  colorTags: '',
  seasonTags: '',
  genderTags: '',
  materialTags: '',
  fitTags: '',
  budgetTier: '',
  silhouette: '',
  formalityLevel: '',
  adminNotes: '',
};

const emptyTrendForm = {
  trendName: '',
  seasonLabel: '',
  styleTags: '',
  colorTags: '',
  occasionTags: '',
  audienceTags: '',
  boostScore: '1.0',
  sourceType: 'ADMIN_MANUAL',
  sourceNote: '',
  summaryText: '',
  activeFrom: '',
  activeTo: '',
};

const listToInput = (values) => (Array.isArray(values) ? values.join(', ') : '');
const inputToList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function useAdminAiManagement(currentUser, selectedProduct) {
  const [metadataForm, setMetadataForm] = useState(emptyMetadataForm);
  const [metadataMessage, setMetadataMessage] = useState('');
  const [metadataError, setMetadataError] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [metadataStatus, setMetadataStatus] = useState(null);
  const [trends, setTrends] = useState([]);
  const [trendForm, setTrendForm] = useState(emptyTrendForm);
  const [editingTrendId, setEditingTrendId] = useState(null);
  const [trendMessage, setTrendMessage] = useState('');
  const [trendError, setTrendError] = useState('');
  const [isSavingTrend, setIsSavingTrend] = useState(false);
  const isAdmin = useMemo(() => hasUserRole(currentUser, 'ADMIN'), [currentUser]);

  useEffect(() => {
    if (!isAdmin) return;

    fetchFashionTrends()
      .then((response) => {
        setTrends(Array.isArray(response) ? response : []);
      })
      .catch(() => {
        setTrendError('Khong the tai danh sach fashion trend.');
      });
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedProduct?.id) {
      setMetadataForm(emptyMetadataForm);
      setMetadataStatus(null);
      return;
    }

    let isMounted = true;
    setIsLoadingMetadata(true);
    setMetadataError('');
    setMetadataMessage('');

    fetchAdminProductAiMetadata(selectedProduct.id)
      .then((response) => {
        if (!isMounted) return;
        setMetadataForm({
          styleTags: listToInput(response.styleTags),
          occasionTags: listToInput(response.occasionTags),
          trendTags: listToInput(response.trendTags),
          sizeTags: listToInput(response.sizeTags),
          colorTags: listToInput(response.colorTags),
          seasonTags: listToInput(response.seasonTags),
          genderTags: listToInput(response.genderTags),
          materialTags: listToInput(response.materialTags),
          fitTags: listToInput(response.fitTags),
          budgetTier: response.budgetTier || '',
          silhouette: response.silhouette || '',
          formalityLevel: response.formalityLevel || '',
          adminNotes: response.adminNotes || '',
        });
        setMetadataStatus({
          searchableText: response.searchableText || '',
          embeddingStatus: response.embeddingStatus || null,
          embeddingModel: response.embeddingModel || '',
        });
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setMetadataError(requestError.message || 'Khong the tai AI metadata cua san pham.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMetadata(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin, selectedProduct?.id]);

  const handleMetadataFieldChange = (event) => {
    const { name, value } = event.target;
    setMetadataForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const submitMetadata = async () => {
    if (!selectedProduct?.id) {
      setMetadataError('Hay chon mot san pham de cap nhat metadata AI.');
      return false;
    }

    setIsSavingMetadata(true);
    setMetadataMessage('');
    setMetadataError('');

    try {
      const response = await updateAdminProductAiMetadata(selectedProduct.id, {
        styleTags: inputToList(metadataForm.styleTags),
        occasionTags: inputToList(metadataForm.occasionTags),
        trendTags: inputToList(metadataForm.trendTags),
        sizeTags: inputToList(metadataForm.sizeTags),
        colorTags: inputToList(metadataForm.colorTags),
        seasonTags: inputToList(metadataForm.seasonTags),
        genderTags: inputToList(metadataForm.genderTags),
        materialTags: inputToList(metadataForm.materialTags),
        fitTags: inputToList(metadataForm.fitTags),
        budgetTier: metadataForm.budgetTier,
        silhouette: metadataForm.silhouette,
        formalityLevel: metadataForm.formalityLevel,
        adminNotes: metadataForm.adminNotes,
      });

      setMetadataStatus({
        searchableText: response.searchableText || '',
        embeddingStatus: response.embeddingStatus || null,
        embeddingModel: response.embeddingModel || '',
      });
      setMetadataMessage('AI metadata da duoc cap nhat va dong bo embedding.');
      return true;
    } catch (requestError) {
      setMetadataError(requestError.message || 'Khong the luu AI metadata.');
      return false;
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleTrendFieldChange = (event) => {
    const { name, value } = event.target;
    setTrendForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const hydrateTrendForm = (trend) => {
    setEditingTrendId(trend.id);
    setTrendForm({
      trendName: trend.trendName || '',
      seasonLabel: trend.seasonLabel || '',
      styleTags: listToInput(trend.styleTags),
      colorTags: listToInput(trend.colorTags),
      occasionTags: listToInput(trend.occasionTags),
      audienceTags: listToInput(trend.audienceTags),
      boostScore: trend.boostScore ?? '1.0',
      sourceType: trend.sourceType || 'ADMIN_MANUAL',
      sourceNote: trend.sourceNote || '',
      summaryText: trend.summaryText || '',
      activeFrom: toDateTimeLocalValue(trend.activeFrom),
      activeTo: toDateTimeLocalValue(trend.activeTo),
    });
    setTrendError('');
    setTrendMessage('');
  };

  const resetTrendForm = () => {
    setEditingTrendId(null);
    setTrendForm(emptyTrendForm);
    setTrendError('');
    setTrendMessage('');
  };

  const submitTrend = async () => {
    setIsSavingTrend(true);
    setTrendError('');
    setTrendMessage('');

    try {
      const payload = {
        trendName: trendForm.trendName,
        seasonLabel: trendForm.seasonLabel,
        styleTags: inputToList(trendForm.styleTags),
        colorTags: inputToList(trendForm.colorTags),
        occasionTags: inputToList(trendForm.occasionTags),
        audienceTags: inputToList(trendForm.audienceTags),
        boostScore: Number(trendForm.boostScore || 1),
        sourceType: trendForm.sourceType,
        sourceNote: trendForm.sourceNote,
        summaryText: trendForm.summaryText,
        activeFrom: trendForm.activeFrom ? new Date(trendForm.activeFrom).toISOString() : null,
        activeTo: trendForm.activeTo ? new Date(trendForm.activeTo).toISOString() : null,
      };

      const response = editingTrendId
        ? await updateFashionTrend(editingTrendId, payload)
        : await createFashionTrend(payload);

      setTrends((currentTrends) => {
        if (editingTrendId) {
          return currentTrends.map((trend) => (trend.id === response.id ? response : trend));
        }
        return [response, ...currentTrends];
      });
      setEditingTrendId(null);
      setTrendForm(emptyTrendForm);
      setTrendMessage(editingTrendId ? 'Trend da duoc cap nhat.' : 'Trend da duoc tao moi.');
      return true;
    } catch (requestError) {
      setTrendError(requestError.message || 'Khong the luu trend.');
      return false;
    } finally {
      setIsSavingTrend(false);
    }
  };

  return {
    isAdmin,
    metadataForm,
    metadataMessage,
    metadataError,
    isLoadingMetadata,
    isSavingMetadata,
    metadataStatus,
    trends,
    trendForm,
    editingTrendId,
    trendMessage,
    trendError,
    isSavingTrend,
    handleMetadataFieldChange,
    submitMetadata,
    handleTrendFieldChange,
    hydrateTrendForm,
    resetTrendForm,
    submitTrend,
  };
}
