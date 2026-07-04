import { requestJson } from './http/request';

const requestAuthJson = async (config, fallbackMessage) => {
  return requestJson(config, fallbackMessage);
};

export const requestRegistrationOtp = async ({ email, fullName, phone, password }) =>
  requestAuthJson(
    {
      url: '/auth/register/request-otp',
      method: 'POST',
      data: { email, fullName, phone, password },
    },
    'Không thể đăng ký và gửi mã OTP.'
  );

export const verifyOtpAndRegister = async ({ email, otpCode }) =>
  requestAuthJson(
    {
      url: '/auth/register/verify-otp',
      method: 'POST',
      data: { email, otpCode },
    },
    'Không thể hoàn tất đăng ký.'
  );

export const registerUser = async (userData) =>
  requestAuthJson(
    {
      url: '/auth/register',
      method: 'POST',
      data: userData,
    },
    'Không thể đăng ký tài khoản.'
  );

export const loginUser = async (credentials) =>
  requestAuthJson(
    {
      url: '/auth/login',
      method: 'POST',
      data: credentials,
    },
    'Không thể đăng nhập.'
  );

export const refreshAccessToken = async () =>
  requestAuthJson(
    {
      url: '/auth/refresh',
      method: 'POST',
    },
    'Không thể làm mới phiên đăng nhập.'
  );
