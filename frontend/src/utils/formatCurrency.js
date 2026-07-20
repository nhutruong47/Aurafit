export const formatCurrency = (amount) => {
  if (amount == null) return '0 ₫';
  const strippedAmount = typeof amount === 'string' ? amount.replace(/[^\d]/g, '') : amount;
  const numericAmount = strippedAmount ? Number(strippedAmount) : 0;
  if (isNaN(numericAmount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericAmount);
};
