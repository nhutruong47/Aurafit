export const formatCurrency = (amount) => {
  if (amount == null) return '0 ₫';
  let numericAmount = amount;
  if (typeof amount === 'string') {
    const stripped = amount.replace(/[^\d]/g, '');
    numericAmount = stripped ? Number(stripped) : 0;
  } else {
    numericAmount = Number(amount);
  }
  if (isNaN(numericAmount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericAmount);
};
