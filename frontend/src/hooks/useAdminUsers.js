import { useEffect, useMemo, useState } from 'react';
import { createStaffAccount, fetchUsers } from '../services/userService';
import { useToastStore } from '../store/useToastStore';
import { hasUserRole } from '../utils/roles';

export function useAdminUsers(currentUser) {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const isAdmin = hasUserRole(currentUser, 'ADMIN');

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const filteredUsers = users; // Server-side filtering replaces this

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;
    setIsLoading(true);
    setError('');

    fetchUsers({
      pageNo: page,
      pageSize: pageSize,
      keyword: userSearch.trim() || undefined,
    })
      .then((data) => {
        if (!mounted) return;
        setUsers(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError.message || 'Hệ thống không thể truy xuất danh sách tài khoản.');
        useToastStore.getState().addToast(loadError.message || 'Hệ thống không thể truy xuất danh sách tài khoản.', 'error');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAdmin, page, pageSize, userSearch]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [userSearch]);


  const createStaff = async (staffPayload) => {
    if (!isAdmin || isCreatingStaff) return null;

    setIsCreatingStaff(true);
    setMessage('');
    setError('');

    try {
      const createdStaff = await createStaffAccount({
        fullName: staffPayload.fullName,
        email: staffPayload.email,
        phone: staffPayload.phone || '',
        status: staffPayload.status || 'ACTIVE',
        temporaryPassword: staffPayload.temporaryPassword || '',
      });

      setUsers((currentUsers) => [createdStaff, ...currentUsers]);
      setMessage(`Đã tạo tài khoản staff cho ${createdStaff.fullName || createdStaff.email}.`);
      useToastStore.getState().addToast(`Đã tạo tài khoản staff cho ${createdStaff.fullName || createdStaff.email}.`, 'success');
      return createdStaff;
    } catch (createError) {
      setError(createError.message || 'Hệ thống gặp sự cố khi khởi tạo tài khoản nhân viên.');
      useToastStore.getState().addToast(createError.message || 'Hệ thống gặp sự cố khi khởi tạo tài khoản nhân viên.', 'error');
      return null;
    } finally {
      setIsCreatingStaff(false);
    }
  };

  return {
    page,
    totalPages,
    totalElements,
    setPage,
    users,
    filteredUsers,
    userSearch,
    message,
    error,
    isLoading,
    isCreatingStaff,
    updatingUserId,
    setUserSearch,
    createStaff,
  };
}
