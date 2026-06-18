// Trang thai rong cua gio thue khi chua co san pham nao.
import EmptyState from '../ui/EmptyState';

export default function CheckoutEmptyState({ onNavigate }) {
  return (
    <EmptyState
      icon="shopping_bag"
      title="Your bag is empty"
      message="Add a statement rental piece first, then we will suggest matching accessories to complete the look."
      actionLabel="Browse Collection"
      onAction={() => onNavigate?.('home')}
    />
  );
}
