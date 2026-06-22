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
      'Khong the dang ky va gui ma OTP.'
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
      'Khong the hoan tat dang ky.'
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
      'Khong the dang ky tai khoan.'
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
      'Khong the dang nhap.'
    )
  );

export const refreshAccessToken = async () =>
  unwrapApiResponse(
    await requestJson(
      {
        url: '/users/refresh',
        method: 'POST',
      },
      'Khong the lam moi phien dang nhap.'
    )
  );
