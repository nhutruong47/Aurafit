import { requestApi } from './http/request';

const requestAuthApi = async (config, fallbackMessage) => {
  return requestApi(config, fallbackMessage);
};

export const requestRegistrationOtp = async ({ email, fullName, phone, password }) =>
  requestAuthApi(
    {
      url: '/auth/register/request-otp',
      method: 'POST',
      data: { email, fullName, phone, password },
    },
    'Không thể đăng ký và gửi mã OTP.'
  );

export const verifyOtpAndRegister = async ({ email, otpCode }) =>
  requestAuthApi(
    {
      url: '/auth/register/verify-otp',
      method: 'POST',
      data: { email, otpCode },
    },
    'Không thể hoàn tất đăng ký.'
  );

export const registerUser = async (userData) =>
  requestAuthApi(
    {
      url: '/auth/register',
      method: 'POST',
      data: userData,
    },
    'Không thể đăng ký tài khoản.'
  );

export const loginUser = async (credentials) =>
  requestAuthApi(
    {
      url: '/auth/login',
      method: 'POST',
      data: credentials,
    },
    'Không thể đăng nhập.'
  );

export const refreshAccessToken = async () =>
  requestAuthApi(
    {
      url: '/auth/refresh',
      method: 'POST',
    },
    'Không thể làm mới phiên đăng nhập.'
  );
