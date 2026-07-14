import { useState } from 'react';
import AccountAuthForm from '../components/account/AccountAuthForm';
import AccountProfileView from '../components/account/AccountProfileView';
import { loginUser, verifyOtpAndRegister } from '../services/authService';
import { getUserRoles } from '../utils/roles';
import authNotify from '../utils/authNotify';
import { parseAuthApiError, validateLoginForm, buildRegisterSuccessMessage } from '../utils/authMessages';

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
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    const validation = validateLoginForm({ email, password });
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const { data: payload, message } = await loginUser({ email, password });
      const user = normalizeAuthUser(payload);
      authNotify.loginSuccess(user, message);
      onAuthChange?.(user);
      onNavigate?.(resolveRolePage(user));
    } catch (error) {
      const errorMessage = parseAuthApiError(error, 'login');
      setFormError(errorMessage);
      authNotify.loginError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (registrationData) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const { data: payload, message } = await verifyOtpAndRegister(registrationData);
      const user = normalizeAuthUser(payload);
      if (user?.accessToken) {
        authNotify.registerSuccess(user, message);
        onAuthChange?.(user);
        onNavigate?.(resolveRolePage(user));
      } else {
        const successMessage = buildRegisterSuccessMessage(user, message);
        authNotify.registerSuccess(user, successMessage);
        setFormError('');
        setMode('login');
      }
    } catch (error) {
      const errorMessage = parseAuthApiError(error, 'register');
      setFormError(errorMessage);
      authNotify.registerError(error, 'otp');
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
