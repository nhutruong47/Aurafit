const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export const formatRelativeTime = (dateValue, now = Date.now()) => {
  if (!dateValue) {
    return '';
  }

  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) {
    return '';
  }

  const elapsed = Math.max(0, now - timestamp);
  if (elapsed < MINUTE_IN_MS) {
    return 'Vừa xong';
  }
  if (elapsed < HOUR_IN_MS) {
    return `${Math.floor(elapsed / MINUTE_IN_MS)} phút trước`;
  }
  if (elapsed < DAY_IN_MS) {
    return `${Math.floor(elapsed / HOUR_IN_MS)} giờ trước`;
  }
  if (elapsed < 7 * DAY_IN_MS) {
    return `${Math.floor(elapsed / DAY_IN_MS)} ngày trước`;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));
};
