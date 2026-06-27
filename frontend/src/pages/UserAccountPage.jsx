import { useState } from 'react';
import AccountAuthForm from '../components/account/AccountAuthForm';
import AccountProfileView from '../components/account/AccountProfileView';
import { loginUser, verifyOtpAndRegister } from '../services/authService';
import { getUserRoles } from '../utils/roles';

const ROLE_REDIRECTS = {
  ADMIN: 'adminDashboard',
  STAFF: 'staffDashboard',
  CUSTOMER: 'home',
};

const resolveRolePage = (user) => {
  const roles = getUserRoles(user);
  if (roles.includes('ADMIN')) return ROLE_REDIRECTS.ADMIN;
  if (roles.includes('STAFF')) return ROLE_REDIRECTS.STAFF;
  return ROLE_REDIRECTS.CUSTOMER;
};

const normalizeAuthUser = (payload) => {
  if (!payload) return null;
  const userDto = payload.user || {};
  const roleName = typeof userDto.role === 'string' ? userDto.role : userDto.role?.name;

  return {
    ...userDto,
    fullName: userDto.fullName || userDto.full_name,
    accessToken: payload.accessToken,
    role: roleName || 'CUSTOMER',
  };
};

export default function UserAccountPage({ onNavigate, currentUser, onAuthChange }) {
  const [mode, setMode] = useState('login');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = await loginUser({
        email: formData.get('email'),
        password: formData.get('password'),
      });
      const user = normalizeAuthUser(payload);
      onAuthChange?.(user);
      onNavigate?.(resolveRolePage(user));
    } catch (error) {
      setFormError(error.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (registrationData) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = await verifyOtpAndRegister(registrationData);
      const user = normalizeAuthUser(payload);
      if (user?.accessToken) {
        onAuthChange?.(user);
        onNavigate?.(resolveRolePage(user));
      } else {
        setFormError('Đăng ký thành công nhưng bạn chưa được đăng nhập tự động. Vui lòng đăng nhập lại.');
        setMode('login');
      }
    } catch (error) {
      setFormError(error.message || 'Không thể hoàn tất đăng ký. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (eventOrPayload) => {
    if (typeof eventOrPayload?.preventDefault === 'function') {
      return handleLogin(eventOrPayload);
    }
    return handleRegister(eventOrPayload);
  };

  if (currentUser) {
    return <AccountProfileView currentUser={currentUser} onNavigate={onNavigate} onAuthChange={onAuthChange} />;
  }

  return (
    <AccountAuthForm
      mode={mode}
      formError={formError}
      isSubmitting={isSubmitting}
      onModeChange={(nextMode) => {
        setMode(nextMode);
        setFormError('');
      }}
      onSubmit={handleSubmit}
    />
  );
}
