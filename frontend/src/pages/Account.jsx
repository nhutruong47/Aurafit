import { useState } from 'react';
import AccountAuthForm from '../components/account/AccountAuthForm';
import AccountProfileView from '../components/account/AccountProfileView';
import { loginUser, registerUser } from '../services/authService';
import { getUserRoles } from '../utils/roles';

export default function Account({ onNavigate, currentUser, onAuthChange }) {
  const [mode, setMode] = useState('login');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (isRegister && formData.get('password') !== formData.get('confirmPassword')) {
      setFormError('Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const user = isRegister
        ? await registerUser({
            email: formData.get('email'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
          })
        : await loginUser({
            email: formData.get('email'),
            password: formData.get('password'),
          });

      onAuthChange?.(user);
      const roles = getUserRoles(user);
      const isAdmin = roles.includes('ADMIN');
      const isStaff = roles.includes('STAFF');
      onNavigate?.(isAdmin ? 'adminDashboard' : isStaff ? 'staffDashboard' : 'home');
    } catch (error) {
      setFormError(error.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
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
