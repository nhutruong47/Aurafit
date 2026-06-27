import { requestJson } from './http/request';

const AUTH_MESSAGE_PATTERNS = [
  [/^Gui ma OTP thanh cong\.?$/i, 'Gửi mã OTP thành công.'],
  [/^Ma xac thuc da duoc gui den email cua ban\.?$/i, 'Mã xác thực đã được gửi đến email của bạn.'],
  [/^Dang ky tai khoan thanh cong!?$/i, 'Đăng ký tài khoản thành công.'],
  [/^Dang nhap thanh cong\.?$/i, 'Đăng nhập thành công.'],
  [/^Lam moi access token thanh cong\.?$/i, 'Làm mới phiên đăng nhập thành công.'],
  [/^Sai tai khoan hoac mat khau\.?$/i, 'Sai tài khoản hoặc mật khẩu.'],
  [/^Khong tim thay email: (.+)$/i, 'Không tìm thấy email: $1'],
  [/^Khong tim thay nguoi dung hop le\.?$/i, 'Không tìm thấy người dùng hợp lệ.'],
  [/^Tai khoan cua ban hien dang bi khoa\.?$/i, 'Tài khoản của bạn hiện đang bị khóa.'],
  [/^Email khong duoc de trong\.?$/i, 'Vui lòng nhập email.'],
  [/^Email khong dung dinh dang\.?$/i, 'Email không đúng định dạng.'],
  [/^Ho ten khong duoc de trong\.?$/i, 'Vui lòng nhập họ tên.'],
  [/^So dien thoai khong duoc de trong\.?$/i, 'Vui lòng nhập số điện thoại.'],
  [/^So dien thoai phai gom 10 chu so va bat dau bang 0\.?$/i, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.'],
  [/^Mat khau khong duoc de trong\.?$/i, 'Vui lòng nhập mật khẩu.'],
  [/^Mat khau phai co it nhat 6 ky tu\.?$/i, 'Mật khẩu phải có ít nhất 6 ký tự.'],
  [/^Ma OTP khong duoc de trong\.?$/i, 'Vui lòng nhập mã OTP.'],
  [/^Ma OTP phai gom dung 6 chu so\.?$/i, 'Mã OTP phải gồm đúng 6 chữ số.'],
  [/^Ma OTP da het han \(qua 5 phut\)\. Vui long gui lai\.?$/i, 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi lại mã mới.'],
  [/^Ma OTP khong dung\. Vui long thu lai\.?$/i, 'Mã OTP không đúng. Vui lòng thử lại.'],
  [/^Email nay da duoc su dung\. Vui long su dung email khac\.?$/i, 'Email này đã được sử dụng. Vui lòng dùng email khác.'],
  [/^Email nay da duoc su dung\.?$/i, 'Email này đã được sử dụng.'],
  [/^Khong the gui email xac thuc\. Vui long thu lai sau\.?$/i, 'Không thể gửi email xác thực. Vui lòng thử lại sau.'],
  [/^Chi email Gmail can xac thuc OTP\.?$/i, 'Chỉ email Gmail mới cần xác thực OTP.'],
  [/^Phien lam viec da het han, vui long dang nhap lai\.?$/i, 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.'],
  [/^Phien lam viec da het han hoac khong hop le, vui long dang nhap lai\.?$/i, 'Phiên làm việc đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.'],
  [/^Ma xac thuc khong hop le, vui long dang nhap lai\.?$/i, 'Mã xác thực không hợp lệ, vui lòng đăng nhập lại.'],
];

const normalizeAuthMessage = (message) => {
  if (typeof message !== 'string') return message;

  const trimmedMessage = message.trim();
  for (const [pattern, replacement] of AUTH_MESSAGE_PATTERNS) {
    if (pattern.test(trimmedMessage)) {
      return trimmedMessage.replace(pattern, replacement);
    }
  }

  return trimmedMessage;
};

const normalizeAuthPayload = (payload) => {
  if (payload && typeof payload === 'object' && typeof payload.message === 'string') {
    return {
      ...payload,
      message: normalizeAuthMessage(payload.message),
    };
  }

  return payload;
};

const requestAuthJson = async (config, fallbackMessage) => {
  try {
    const payload = await requestJson(config, fallbackMessage);
    return normalizeAuthPayload(payload);
  } catch (error) {
    throw new Error(normalizeAuthMessage(error.message) || fallbackMessage, { cause: error });
  }
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
