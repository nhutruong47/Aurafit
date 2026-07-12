import { useEffect, useMemo, useState } from 'react';
import { createStaffAccount, fetchUsers } from '../services/userService';
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

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;
    setIsLoading(true);
    setError('');

    fetchUsers()
      .then((data) => {
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError.message || 'Hệ thống không thể truy xuất danh sách tài khoản.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.fullName, user.email, user.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [userSearch, users]);


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
      return createdStaff;
    } catch (createError) {
      setError(createError.message || 'Hệ thống gặp sự cố khi khởi tạo tài khoản nhân viên.');
      return null;
    } finally {
      setIsCreatingStaff(false);
    }
  };

  return {
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
