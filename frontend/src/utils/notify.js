import { useToastStore } from '../store/useToastStore';
import { getErrorMessage } from '../services/http/request';

const push = (message, type = 'success', duration) => {
  if (!message) return;
  useToastStore.getState().addToast(message, type, duration);
};

export const notify = {
  success: (message, duration) => push(message, 'success', duration),
  error: (message, duration) => push(message, 'error', duration),
  info: (message, duration) => push(message, 'info', duration),
  warning: (message, duration) => push(message, 'warning', duration),

  fromError: (error, fallback = 'Đã xảy ra lỗi hệ thống.') => {
    push(getErrorMessage(error, fallback), 'error');
  },
};

export default notify;
