// Trang thai rong cua gio thue khi chua co san pham nao.
import EmptyState from '../ui/EmptyState';

export default function CheckoutEmptyState({ onNavigate }) {
  return (
    <EmptyState
      icon="shopping_bag"
      title="Giỏ hàng của bạn đang trống"
      message="Hãy thêm một sản phẩm thuê trước, sau đó AuraFit sẽ gợi ý phụ kiện phù hợp để hoàn thiện diện mạo."
      actionLabel="Xem bộ sưu tập"
      onAction={() => onNavigate?.('home')}
    />
  );
}
