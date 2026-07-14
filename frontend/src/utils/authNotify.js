import notify from './notify';
import {
  buildLoginSuccessMessage,
  buildRegisterOtpResentMessage,
  buildRegisterOtpSentMessage,
  buildRegisterSuccessMessage,
  parseAuthApiError,
} from './authMessages';

export const authNotify = {
  loginSuccess(user, apiMessage) {
    notify.success(buildLoginSuccessMessage(user, apiMessage));
  },

  loginError(error) {
    notify.error(parseAuthApiError(error, 'login'));
  },

  loginValidation(message) {
    notify.error(message);
  },

  registerOtpSent(email, apiMessage) {
    notify.success(buildRegisterOtpSentMessage(email, apiMessage));
  },

  registerOtpResent(email) {
    notify.info(buildRegisterOtpResentMessage(email));
  },

  registerSuccess(user, apiMessage) {
    notify.success(buildRegisterSuccessMessage(user, apiMessage));
  },

  registerError(error, phase = 'register') {
    const context = phase === 'otp' ? 'register' : 'register';
    notify.error(parseAuthApiError(error, context));
  },

  registerValidation(message) {
    notify.error(message);
  },
};

export default authNotify;
