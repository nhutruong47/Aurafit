import { useMemo } from 'react';
import AdminOverviewSection from './AdminOverviewSection';

export default function AdminOverviewTab({ productsCount, categoriesCount }) {
  const metricCards = useMemo(
    () => [
      { label: 'Đơn đang xử lý', value: '47', delta: '+8 hôm nay' },
      {
        label: 'Sản phẩm đang hiển thị',
        value: `${productsCount}`,
        delta: `${categoriesCount} danh mục đang hoạt động`,
      },
    ],
    [productsCount, categoriesCount]
  );

  return <AdminOverviewSection metricCards={metricCards} />;
}
