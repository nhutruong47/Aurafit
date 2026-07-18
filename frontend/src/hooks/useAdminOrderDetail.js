import { useState } from 'react';
import { adminOrderService } from '../services/adminOrderService';

export function useAdminOrderDetail(orderId, onRefresh) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (actionFn, successMsg) => {
    try {
      setIsLoading(true);
      await actionFn(orderId);
      window.alert(successMsg);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      window.alert(error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    window.alert(`Đã copy mã vận đơn ${type}`);
  };

  const onDeliveryFailedClick = async () => {
    const reason = window.prompt('Nhập lý do / Ghi chú sự cố giao hàng thất bại (Bắt buộc):');
    if (!reason || !reason.trim()) {
      window.alert('Vui lòng nhập lý do để xử lý.');
      return;
    }
    
    try {
      setIsLoading(true);
      await adminOrderService.handleDeliveryFailed(orderId, reason.trim());
      window.alert('Đã đánh dấu đơn hàng: Giao hàng thất bại (Boom hàng).');
      if (onRefresh) onRefresh();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Lỗi khi xử lý thao tác này');
    } finally {
      setIsLoading(false);
    }
  };

  const onLostPackageClick = async () => {
    const reason = window.prompt('Nhập lý do / Ghi chú sự cố thất lạc hàng hóa (Bắt buộc):');
    if (!reason || !reason.trim()) {
      window.alert('Vui lòng nhập lý do để xử lý.');
      return;
    }
    
    try {
      setIsLoading(true);
      await adminOrderService.handleLostPackage(orderId, reason.trim());
      window.alert('Đã đánh dấu đơn hàng: Thất lạc kiện hàng.');
      if (onRefresh) onRefresh();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Lỗi khi xử lý thao tác này');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleAction,
    copyToClipboard,
    onDeliveryFailedClick,
    onLostPackageClick
  };
}
