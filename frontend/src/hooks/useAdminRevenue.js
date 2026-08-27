import { useEffect, useMemo, useState } from 'react';
import { fetchRevenueChart, fetchRevenueTransactions } from '../services/analyticsService';

const toDateInputValue = (date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const toStartDateTime = (date) => (date ? `${date}T00:00:00` : undefined);
const toEndDateTime = (date) => (date ? `${date}T23:59:59.999999999` : undefined);

export function useAdminRevenue() {
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 29);
    return date;
  }, [today]);

  const [startDate, setStartDate] = useState(toDateInputValue(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const validationError = startDate && endDate && startDate > endDate
    ? 'Ngày bắt đầu không được sau ngày kết thúc.'
    : '';

  useEffect(() => {
    if (validationError) {
      const timerId = window.setTimeout(() => setIsLoading(false), 0);
      return () => window.clearTimeout(timerId);
    }

    let mounted = true;
    const timerId = window.setTimeout(() => {
      if (!mounted) return;
      setIsLoading(true);
      setLoadError('');

      const startDateTime = toStartDateTime(startDate);
      const endDateTime = toEndDateTime(endDate);

      Promise.all([
        fetchRevenueTransactions({
          page,
          size: 10,
          keyword: keyword.trim() || undefined,
          startDate: startDateTime,
          endDate: endDateTime,
        }),
        fetchRevenueChart(startDateTime, endDateTime),
      ])
        .then(([transactionData, revenueChart]) => {
          if (!mounted) return;
          setTransactions(Array.isArray(transactionData?.content) ? transactionData.content : []);
          setTotalPages(transactionData?.totalPages || 0);
          setTotalElements(transactionData?.totalElements || 0);
          setChartData(Array.isArray(revenueChart) ? revenueChart : []);
        })
        .catch((error) => {
          if (!mounted) return;
          setTransactions([]);
          setChartData([]);
          setTotalPages(0);
          setTotalElements(0);
          setLoadError(error.message || 'Không thể tải dữ liệu doanh thu. 🥺');
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    }, 0);

    return () => {
      mounted = false;
      window.clearTimeout(timerId);
    };
  }, [page, keyword, startDate, endDate, validationError]);

  const changeKeyword = (value) => {
    setKeyword(value);
    setPage(0);
  };

  const changeStartDate = (value) => {
    setStartDate(value);
    setPage(0);
  };

  const changeEndDate = (value) => {
    setEndDate(value);
    setPage(0);
  };

  return {
    startDate,
    endDate,
    keyword,
    page,
    transactions,
    chartData,
    totalPages,
    totalElements,
    isLoading,
    error: validationError || loadError,
    setPage,
    changeKeyword,
    changeStartDate,
    changeEndDate,
  };
}
