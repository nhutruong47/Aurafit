import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/http/apiClient';
import { useToastStore } from '../store/useToastStore';

export function useAdminAds(currentUser) {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const fetchAds = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/advertisements');
      setAds(response.data);
    } catch (error) {
      addToast('Lỗi khi tải danh sách quảng cáo.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const createAd = async (adData) => {
    setIsSaving(true);
    try {
      const response = await apiClient.post('/admin/advertisements', adData);
      setAds((prev) => [...prev, response.data]);
      addToast('Đã thêm quảng cáo mới thành công.');
      return true;
    } catch (error) {
      addToast('Lỗi khi thêm quảng cáo mới.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAd = async (id, adData) => {
    setIsSaving(true);
    try {
      const response = await apiClient.put(`/admin/advertisements/${id}`, adData);
      setAds((prev) => prev.map((ad) => (ad.id === id ? response.data : ad)));
      addToast('Cập nhật quảng cáo thành công.');
      return true;
    } catch (error) {
      addToast('Lỗi khi cập nhật quảng cáo.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAd = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá quảng cáo này?')) return;
    setIsSaving(true);
    try {
      await apiClient.delete(`/admin/advertisements/${id}`);
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      addToast('Đã xoá quảng cáo.');
    } catch (error) {
      addToast('Lỗi khi xoá quảng cáo.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAdStatus = async (ad) => {
    setIsSaving(true);
    try {
      const updatedAd = { ...ad, isActive: !ad.isActive };
      const response = await apiClient.put(`/admin/advertisements/${ad.id}`, updatedAd);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? response.data : a)));
      addToast(`Đã ${updatedAd.isActive ? 'bật' : 'tắt'} quảng cáo.`);
    } catch (error) {
      addToast('Lỗi khi cập nhật trạng thái quảng cáo.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const moveAd = async (ad, direction) => {
    setIsSaving(true);
    try {
      const samePositionAds = ads.filter(a => a.position === ad.position).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      const currentIndex = samePositionAds.findIndex(a => a.id === ad.id);
      
      if (direction === -1 && currentIndex > 0) {
        const swapAd = samePositionAds[currentIndex - 1];
        const currentOrder = ad.displayOrder || 0;
        let targetOrder = swapAd.displayOrder || 0;
        if (currentOrder === targetOrder) targetOrder = currentOrder - 1;
        
        await apiClient.put(`/admin/advertisements/${ad.id}`, { ...ad, displayOrder: targetOrder });
        await apiClient.put(`/admin/advertisements/${swapAd.id}`, { ...swapAd, displayOrder: currentOrder });
        await fetchAds();
      } else if (direction === 1 && currentIndex < samePositionAds.length - 1) {
        const swapAd = samePositionAds[currentIndex + 1];
        const currentOrder = ad.displayOrder || 0;
        let targetOrder = swapAd.displayOrder || 0;
        if (currentOrder === targetOrder) targetOrder = currentOrder + 1;
        
        await apiClient.put(`/admin/advertisements/${ad.id}`, { ...ad, displayOrder: targetOrder });
        await apiClient.put(`/admin/advertisements/${swapAd.id}`, { ...swapAd, displayOrder: currentOrder });
        await fetchAds();
      }
    } catch (error) {
      addToast('Lỗi khi thay đổi thứ tự.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    ads,
    isLoading,
    isSaving,
    createAd,
    updateAd,
    deleteAd,
    toggleAdStatus,
    moveAd,
    fetchAds,
  };
}
