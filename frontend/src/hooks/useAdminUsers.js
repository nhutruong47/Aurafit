import { useCallback, useEffect, useState } from 'react';
import { createStaffAccount, fetchUsers, updateUserStatus } from '../services/userService';
import { useToastStore } from '../store/useToastStore';
import { hasUserRole } from '../utils/roles';

export function useAdminUsers(currentUser) {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [activeRole, setActiveRole] = useState('STAFF');
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

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchUsers({
        pageNo: page,
        pageSize,
        keyword: userSearch.trim() || undefined,
        role: activeRole,
      });

      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (loadError) {
      const errorMessage = loadError.message || 'Hệ thống không thể truy xuất danh sách tài khoản.';
      setUsers([]);
      setTotalPages(1);
      setTotalElements(0);
      setError(errorMessage);
      useToastStore.getState().addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeRole, isAdmin, page, pageSize, userSearch]);

  useEffect(() => {
    const timerId = window.setTimeout(loadUsers, userSearch ? 300 : 0);
    return () => window.clearTimeout(timerId);
  }, [loadUsers, userSearch]);

  const changeUserSearch = (value) => {
    setUserSearch(value);
    setPage(0);
  };

  const changeActiveRole = (role) => {
    setActiveRole(role);
    setUserSearch('');
    setPage(0);
    setMessage('');
    setError('');
  };

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
      setTotalElements((currentTotal) => currentTotal + 1);
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

  const changeUserStatus = async (userId, status) => {
    if (!isAdmin || updatingUserId) return null;

    setUpdatingUserId(userId);
    setMessage('');
    setError('');

    try {
      const updatedUser = await updateUserStatus(userId, status);
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
      const successMessage = status === 'ACTIVE'
        ? `Đã kích hoạt tài khoản ${updatedUser.email}.`
        : `Đã vô hiệu hóa tài khoản ${updatedUser.email}.`;
      setMessage(successMessage);
      useToastStore.getState().addToast(successMessage, 'success');
      return updatedUser;
    } catch (updateError) {
      const errorMessage = updateError.message || 'Không thể cập nhật trạng thái tài khoản.';
      setError(errorMessage);
      useToastStore.getState().addToast(errorMessage, 'error');
      return null;
    } finally {
      setUpdatingUserId(null);
    }
  };

  return {
    page,
    totalPages,
    totalElements,
    setPage,
    users,
    filteredUsers: users,
    userSearch,
    activeRole,
    message,
    error,
    isLoading,
    isCreatingStaff,
    updatingUserId,
    setUserSearch: changeUserSearch,
    setActiveRole: changeActiveRole,
    createStaff,
    changeUserStatus,
  };
}
