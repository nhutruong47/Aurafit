import { useEffect, useState } from 'react';
import { fetchAdminCostumes } from '../services/costumeService';
import {
  assignEventCostumes,
  createEvent,
  deleteEvent,
  fetchAdminEvents,
  removeEventCostume,
  updateEvent,
} from '../services/eventService';
import { useToastStore } from '../store/useToastStore';
import { hasUserRole } from '../utils/roles';

export const emptyEventForm = {
  name: '',
  description: '',
  bannerImageUrl: '',
  sideBannerImageUrl: '',
  discountPercent: '',
  startDate: '',
  endDate: '',
  status: 'DRAFT',
  costumeAssignments: [],
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  return String(value).slice(0, 16);
};

const loadAllAdminCostumes = async () => {
  const pageSize = 100;
  const firstPage = await fetchAdminCostumes({ pageNo: 0, pageSize, sortBy: 'name', sortDir: 'asc' });
  const remainingPageNumbers = Array.from(
    { length: Math.max(0, Number(firstPage.totalPages || 1) - 1) },
    (_, index) => index + 1
  );
  const remainingPages = await Promise.all(
    remainingPageNumbers.map((pageNo) => (
      fetchAdminCostumes({ pageNo, pageSize, sortBy: 'name', sortDir: 'asc' })
    ))
  );
  return [firstPage, ...remainingPages].flatMap((page) => (
    Array.isArray(page?.data) ? page.data : []
  ));
};

const normalizeAssignments = (costumes) => (
  Array.isArray(costumes)
    ? costumes.map((costume) => ({
        costumeId: Number(costume.costumeId),
        discountPercentOverride: costume.discountPercentOverride ?? '',
      }))
    : []
);

export function useAdminEvents(currentUser) {
  const isAdmin = hasUserRole(currentUser, 'ADMIN');
  const [events, setEvents] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);
  const [originalCostumeIds, setOriginalCostumeIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCostumes, setIsLoadingCostumes] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    fetchAdminEvents(statusFilter)
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((loadError) => {
        const loadMessage = loadError.message || 'Không thể tải danh sách sự kiện.';
        setError(loadMessage);
        useToastStore.getState().addToast(loadMessage, 'error');
      })
      .finally(() => setIsLoading(false));
  }, [isAdmin, reloadKey, statusFilter]);

  useEffect(() => {
    if (!isAdmin) return;

    loadAllAdminCostumes()
      .then(setCostumes)
      .catch((loadError) => {
        useToastStore.getState().addToast(
          loadError.message || 'Không thể tải danh sách sản phẩm để gắn sự kiện.',
          'error'
        );
      })
      .finally(() => setIsLoadingCostumes(false));
  }, [isAdmin]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setEventForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleBannerChange = (bannerImageUrl) => {
    setEventForm((currentForm) => ({
      ...currentForm,
      bannerImageUrl: bannerImageUrl || '',
    }));
  };

  const handleSideBannerChange = (sideBannerImageUrl) => {
    setEventForm((currentForm) => ({
      ...currentForm,
      sideBannerImageUrl: sideBannerImageUrl || '',
    }));
  };

  const handleCostumeAssignmentsChange = (costumeAssignments) => {
    setEventForm((currentForm) => ({
      ...currentForm,
      costumeAssignments: Array.isArray(costumeAssignments) ? costumeAssignments : [],
    }));
  };

  const hydrateEventForm = (event) => {
    const assignments = normalizeAssignments(event.costumes);
    setEditingEventId(event.id);
    setOriginalCostumeIds(assignments.map((assignment) => assignment.costumeId));
    setEventForm({
      name: event.name || '',
      description: event.description || '',
      bannerImageUrl: event.bannerImageUrl || '',
      sideBannerImageUrl: event.sideBannerImageUrl || '',
      discountPercent: event.discountPercent ?? '',
      startDate: toDateTimeLocal(event.startDate),
      endDate: toDateTimeLocal(event.endDate),
      status: event.status || 'DRAFT',
      costumeAssignments: assignments,
    });
    setMessage('');
    setError('');
  };

  const hydrateSuggestedEventForm = (suggestion) => {
    const costumeIds = Array.isArray(suggestion?.costumeIds) ? suggestion.costumeIds : [];
    const uniqueCostumeIds = [...new Set(
      costumeIds
        .map(Number)
        .filter((costumeId) => Number.isSafeInteger(costumeId) && costumeId > 0)
    )];

    setEditingEventId(null);
    setOriginalCostumeIds([]);
    setEventForm({
      ...emptyEventForm,
      name: suggestion?.name || '',
      discountPercent: suggestion?.suggestedDiscountPercent ?? '',
      costumeAssignments: uniqueCostumeIds.map((costumeId) => ({
        costumeId,
        discountPercentOverride: '',
      })),
    });
    setMessage('');
    setError('');
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setOriginalCostumeIds([]);
    setEventForm(emptyEventForm);
    setMessage('');
    setError('');
  };

  const validateForm = () => {
    const discountPercent = Number(eventForm.discountPercent);
    if (!eventForm.name.trim()) return 'Tên sự kiện không được để trống.';
    if (!(discountPercent > 0 && discountPercent <= 100)) {
      return 'Phần trăm giảm giá phải nằm trong khoảng (0, 100].';
    }
    if (!eventForm.startDate || !eventForm.endDate) {
      return 'Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.';
    }
    if (new Date(eventForm.startDate).getTime() >= new Date(eventForm.endDate).getTime()) {
      return 'Thời gian bắt đầu phải trước thời gian kết thúc.';
    }
    const invalidOverride = eventForm.costumeAssignments.some((assignment) => {
      if (assignment.discountPercentOverride === '' || assignment.discountPercentOverride == null) {
        return false;
      }
      const override = Number(assignment.discountPercentOverride);
      return !(override > 0 && override <= 100);
    });
    if (invalidOverride) {
      return 'Mức giảm riêng của sản phẩm phải để trống hoặc nằm trong khoảng (0, 100].';
    }
    return '';
  };

  const syncCostumeAssignments = async (eventId) => {
    const assignments = eventForm.costumeAssignments.map((assignment) => ({
      costumeId: Number(assignment.costumeId),
      discountPercentOverride:
        assignment.discountPercentOverride === '' || assignment.discountPercentOverride == null
          ? null
          : Number(assignment.discountPercentOverride),
    }));
    const selectedIds = new Set(assignments.map((assignment) => assignment.costumeId));

    if (assignments.length > 0) {
      await assignEventCostumes(eventId, assignments);
    }

    const removedCostumeIds = originalCostumeIds.filter((costumeId) => !selectedIds.has(costumeId));
    await Promise.all(
      removedCostumeIds.map((costumeId) => removeEventCostume(eventId, costumeId))
    );
  };

  const submitEvent = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      useToastStore.getState().addToast(validationMessage, 'error');
      return false;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        name: eventForm.name.trim(),
        description: eventForm.description.trim() || null,
        bannerImageUrl: eventForm.bannerImageUrl.trim(),
        sideBannerImageUrl: eventForm.sideBannerImageUrl.trim(),
        discountPercent: Number(eventForm.discountPercent),
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        status: eventForm.status,
      };

      const savedEvent = editingEventId
        ? await updateEvent(editingEventId, payload)
        : await createEvent(payload);
      await syncCostumeAssignments(savedEvent.id);

      const successMessage = editingEventId
        ? 'Sự kiện đã được cập nhật thành công.'
        : 'Sự kiện đã được tạo thành công.';
      resetEventForm();
      setMessage(successMessage);
      useToastStore.getState().addToast(successMessage, 'success');
      setIsLoading(true);
      setReloadKey((currentKey) => currentKey + 1);
      return true;
    } catch (saveError) {
      const saveMessage = saveError.message || 'Không thể lưu sự kiện.';
      setError(saveMessage);
      useToastStore.getState().addToast(saveMessage, 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (eventId, eventName) => {
    if (!window.confirm(`Xóa sự kiện "${eventName}"? Hành động này không thể hoàn tác.`)) return;

    setError('');
    try {
      await deleteEvent(eventId);
      setIsLoading(true);
      setReloadKey((currentKey) => currentKey + 1);
      useToastStore.getState().addToast(`Đã xóa sự kiện "${eventName}".`, 'success');
      if (editingEventId === eventId) resetEventForm();
    } catch (deleteError) {
      const deleteMessage = deleteError.message || 'Không thể xóa sự kiện.';
      setError(deleteMessage);
      useToastStore.getState().addToast(deleteMessage, 'error');
    }
  };

  return {
    events,
    costumes,
    eventForm,
    editingEventId,
    statusFilter,
    isLoading,
    isLoadingCostumes,
    isSaving,
    message,
    error,
    setStatusFilter: (status) => {
      setIsLoading(true);
      setStatusFilter(status);
    },
    handleFieldChange,
    handleBannerChange,
    handleSideBannerChange,
    handleCostumeAssignmentsChange,
    hydrateEventForm,
    hydrateSuggestedEventForm,
    resetEventForm,
    submitEvent,
    handleDelete,
  };
}
