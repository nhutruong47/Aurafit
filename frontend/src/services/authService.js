import { requestJson } from './http/request';

export const requestRegistrationOtp = async ({ email, fullName, phone, password }) =>
  requestJson(
    {
      url: '/auth/register/request-otp',
      method: 'POST',
      data: { email, fullName, phone, password },
    },
    'Không thể đăng ký và gửi mã OTP.'
  );

export const verifyOtpAndRegister = async ({ email, otpCode }) =>
  requestJson(
    {
      url: '/auth/register/verify-otp',
      method: 'POST',
      data: { email, otpCode },
    },
    'Không thể hoàn tất đăng ký.'
  );

export const registerUser = async (userData) =>
  requestJson(
    {
      url: '/auth/register',
      method: 'POST',
      data: userData,
    },
    'Không thể đăng ký tài khoản.'
  );

export const loginUser = async (credentials) =>
  requestJson(
    {
      url: '/auth/login',
      method: 'POST',
      data: credentials,
    },
    'Không thể đăng nhập.'
  );

export const refreshAccessToken = async () =>
  requestJson(
    {
      url: '/auth/refresh',
      method: 'POST',
    },
    'Không thể làm mới phiên đăng nhập.'
  );
