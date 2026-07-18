import { requestJson } from './http/request';

export const fetchProvinces = async () =>
  requestJson(
    {
      url: '/ghn/provinces',
      method: 'GET',
    },
    'Không thể tải danh sách Tỉnh/Thành phố.'
  );

export const fetchDistricts = async (provinceId) =>
  requestJson(
    {
      url: `/ghn/districts?provinceId=${provinceId}`,
      method: 'GET',
    },
    'Không thể tải danh sách Quận/Huyện.'
  );

export const fetchWards = async (districtId) =>
  requestJson(
    {
      url: `/ghn/wards?districtId=${districtId}`,
      method: 'GET',
    },
    'Không thể tải danh sách Phường/Xã.'
  );

export const calculateShippingFee = async (toDistrictId, toWardCode) =>
  requestJson(
    {
      url: '/ghn/calculate-fee',
      method: 'POST',
      data: { toDistrictId, toWardCode },
    },
    'Không thể tính phí vận chuyển.'
  );
