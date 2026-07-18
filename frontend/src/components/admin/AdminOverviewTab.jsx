import { useMemo } from 'react';
import AdminOverviewSection from './AdminOverviewSection';

export default function AdminOverviewTab({ analytics, productsCount, categoriesCount }) {
  const metricCards = useMemo(() => {
    if (!analytics?.overview || !analytics?.aiStylist) {
      return [
        { label: 'Đơn đang xử lý', value: '47', delta: '+8 hôm nay' },
        { label: 'Recommendation CTR', value: '--', delta: 'Đang chờ dữ liệu' },
        { label: 'AI Stylist session', value: '--', delta: 'Đang chờ dữ liệu' },
        { label: 'Sản phẩm đang hiển thị', value: `${productsCount}`, delta: 'Admin quản lý' },
      ];
    }

    return [
      {
        label: 'Recommendation CTR',
        value: `${Number(analytics.overview.recommendationCtr || 0).toFixed(2)}%`,
        delta: `${analytics.overview.recommendationClicks} click / ${analytics.overview.recommendationImpressions} impression`,
      },
      {
        label: 'AI Stylist session',
        value: `${analytics.aiStylist.sessionsStarted}`,
        delta: `${analytics.aiStylist.userMessages} tin nhắn người dùng`,
      },
      {
        label: 'Rent từ AI Stylist',
        value: `${analytics.aiStylist.attributedRents}`,
        delta: `${analytics.aiStylist.attributedAddToCarts} add-to-cart có attribution`,
      },
      {
        label: 'Sản phẩm đang hiển thị',
        value: `${productsCount}`,
        delta: `${categoriesCount} danh mục đang hoạt động`,
      },
    ];
  }, [analytics, productsCount, categoriesCount]);

  return <AdminOverviewSection metricCards={metricCards} />;
}
