import { requestJson } from './http/request';

const unwrapApiResponse = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return payload.data;
  }
  return payload;
};

export const requestRegistrationOtp = async ({ email, fullName, phone, password }) =>
  unwrapApiResponse(
    await requestJson(
      {
        url: '/auth/register/request-otp',
        method: 'POST',
        data: { email, fullName, phone, password },
      },
      'Không thể đăng ký và gửi mã OTP.'
    )
  );

export const verifyOtpAndRegister = async ({ email, otpCode }) =>
  unwrapApiResponse(
    await requestJson(
      {
        url: '/auth/register/verify-otp',
        method: 'POST',
        data: { email, otpCode },
      },
      'Không thể hoàn tất đăng ký.'
    )
  );

export const registerUser = async (userData) =>
  unwrapApiResponse(
    await requestJson(
      {
        url: '/users/register',
        method: 'POST',
        data: userData,
      },
      'Không thể đăng ký tài khoản.'
    )
  );

export const loginUser = async (credentials) =>
  unwrapApiResponse(
    await requestJson(
      {
        url: '/users/login',
        method: 'POST',
        data: credentials,
      },
      'Không thể đăng nhập.'
    )
  );

export const refreshAccessToken = async () =>
  unwrapApiResponse(
    await requestJson(
      {
        url: '/users/refresh',
        method: 'POST',
      },
      'Không thể làm mới phiên đăng nhập.'
    )
  );
