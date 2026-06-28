import { useEffect, useMemo, useState } from 'react';
import { fetchUsers, updateUserRole } from '../services/userService';
import { hasUserRole } from '../utils/roles';

export function useAdminUsers(currentUser) {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        setError(loadError.message || 'Không thể tải danh sách tài khoản.');
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

  const setSellerPermission = async (user, enabled) => {
    if (!user?.id || updatingUserId) return;

    setUpdatingUserId(user.id);
    setMessage('');
    setError('');

    try {
      const updatedUser = await updateUserRole(user.id, enabled ? 'SELLER' : 'CUSTOMER');
      setUsers((currentUsers) =>
        currentUsers.map((currentUserItem) =>
          currentUserItem.id === updatedUser.id ? updatedUser : currentUserItem
        )
      );
      setMessage(enabled ? 'Đã cấp quyền cho thuê sản phẩm.' : 'Đã thu hồi quyền cho thuê sản phẩm.');
    } catch (updateError) {
      setError(updateError.message || 'Không thể cập nhật quyền tài khoản.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return {
    users,
    filteredUsers,
    userSearch,
    message,
    error,
    isLoading,
    updatingUserId,
    setUserSearch,
    setSellerPermission,
  };
}
