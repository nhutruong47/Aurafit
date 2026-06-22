import { requestJson } from './http/request';

export const registerUser = async (userData) =>
  requestJson({
    url: '/users/register',
    method: 'POST',
    data: userData,
  });

export const loginUser = async (credentials) =>
  requestJson({
    url: '/users/login',
    method: 'POST',
    data: credentials,
  });
