import { getErrorMessage } from '../services/http/request';

const FIELD_LABELS = {
  email: 'Email',
  password: 'Mật khẩu',
  fullName: 'Họ tên',
  phone: 'Số điện thoại',
  otpCode: 'Mã OTP',
  confirmPassword: 'Xác nhận mật khẩu',
};

const KNOWN_API_MESSAGES = [
  {
    pattern: /tài khoản hoặc mật khẩu không chính xác/i,
    login: 'Email hoặc mật khẩu không chính xác.',
  },
  {
    pattern: /tài khoản.*bị khóa/i,
    login: 'Tài khoản đang bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.',
  },
  {
    pattern: /email này đã tồn tại|email nay da duoc su dung/i,
    register: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc chuyển sang đăng nhập.',
  },
  {
    pattern: /chi email gmail|chỉ email gmail/i,
    register: 'Chỉ hỗ trợ email Gmail (@gmail.com) để xác thực OTP.',
  },
  {
    pattern: /mã xác thực otp không chính xác/i,
    register: 'Mã OTP không đúng. Vui lòng kiểm tra lại email và nhập lại mã 6 chữ số.',
  },
  {
    pattern: /otp đã hết hạn|otp da het han/i,
    register: 'Mã OTP đã hết hạn. Vui lòng bấm "Gửi lại mã" để nhận mã mới.',
  },
  {
    pattern: /chưa yêu cầu mã xác thực|chua yeu cau ma xac thuc/i,
    register: 'Chưa có yêu cầu OTP cho email này. Vui lòng quay lại bước nhập thông tin và đăng ký lại.',
  },
  {
    pattern: /không thể gửi email|khong the gui email/i,
    register: 'Không gửi được email OTP. Vui lòng kiểm tra địa chỉ email và thử lại sau.',
  },
  {
    pattern: /phiên làm việc|phien lam viec|hết hạn.*đăng nhập/i,
    login: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  },
];

const formatValidationErrors = (rawMessage) => {
  const body = rawMessage.replace(/^Validation failed\s*-\s*/i, '').trim();
  if (!body) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và nhập lại.';

  const parts = body.split(',').map((part) => part.trim()).filter(Boolean);
  const formatted = parts.map((part) => {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) return part;

    const field = part.slice(0, colonIndex).trim();
    const message = part.slice(colonIndex + 1).trim();
    const label = FIELD_LABELS[field] || field;
    return `${label}: ${message}`;
  });

  if (formatted.length === 1) return formatted[0];
  return formatted.join(' ');
};

const matchKnownMessage = (rawMessage, context) => {
  for (const entry of KNOWN_API_MESSAGES) {
    if (entry.pattern.test(rawMessage) && entry[context]) {
      return entry[context];
    }
  }
  return null;
};

export const parseAuthApiError = (error, context = 'login') => {
  const raw = getErrorMessage(error, '');
  const status = error?.cause?.response?.status;

  if (raw.includes('Validation failed')) {
    const details = formatValidationErrors(raw);
    const prefix = context === 'login' ? 'Đăng nhập không thành công' : 'Đăng ký không thành công';
    return `${prefix}: ${details}`;
  }

  const known = matchKnownMessage(raw, context);
  if (known) {
    const prefix = context === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại';
    return `${prefix}: ${known}`;
  }

  if (status === 401 && context === 'login') {
    return 'Đăng nhập thất bại: Email hoặc mật khẩu không chính xác.';
  }

  if (status === 409 && context === 'register') {
    return 'Đăng ký thất bại: Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.';
  }

  if (status === 400 && context === 'register') {
    return raw
      ? `Đăng ký không thành công: ${raw}`
      : 'Đăng ký không thành công. Vui lòng kiểm tra và nhập lại thông tin.';
  }

  if (status >= 500) {
    const action = context === 'login' ? 'đăng nhập' : 'đăng ký';
    return `Không thể ${action} lúc này do hệ thống tạm thời gián đoạn. Vui lòng thử lại sau vài phút.`;
  }

  const prefix = context === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại';
  return raw ? `${prefix}: ${raw}` : `${prefix}. Vui lòng thử lại.`;
};

export const validateLoginForm = ({ email, password }) => {
  const issues = [];

  if (!email?.trim()) issues.push('Email không được để trống.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    issues.push('Email không đúng định dạng.');
  }

  if (!password) issues.push('Mật khẩu không được để trống.');

  return {
    valid: issues.length === 0,
    issues,
    message:
      issues.length === 1
        ? `Đăng nhập không thành công: ${issues[0]}`
        : 'Đăng nhập không thành công. Vui lòng nhập đầy đủ email và mật khẩu hợp lệ.',
  };
};

export const validateRegisterDetails = (form) => {
  const issues = [];

  if (!form.fullName?.trim()) issues.push('Họ tên không được để trống.');
  if (!/^0\d{9}$/.test(form.phone || '')) {
    issues.push('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.');
  }
  if (!form.email?.trim()) issues.push('Email không được để trống.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    issues.push('Email không đúng định dạng.');
  } else if (!form.email.trim().toLowerCase().endsWith('@gmail.com')) {
    issues.push('Chỉ hỗ trợ email Gmail (@gmail.com).');
  }
  if (!form.password) issues.push('Mật khẩu không được để trống.');
  else if (form.password.length < 6) issues.push('Mật khẩu phải có ít nhất 6 ký tự.');
  if (form.password !== form.confirmPassword) issues.push('Mật khẩu xác nhận không khớp.');

  return {
    valid: issues.length === 0,
    issues,
    message:
      issues.length === 1
        ? `Đăng ký không thành công: ${issues[0]}`
        : 'Đăng ký không thành công. Vui lòng kiểm tra và nhập lại thông tin.',
  };
};

export const validateOtpInput = (otpCode) => {
  if (!otpCode || otpCode.length !== 6) {
    return {
      valid: false,
      message: 'Đăng ký không thành công: Mã OTP phải gồm đúng 6 chữ số.',
    };
  }
  return { valid: true, message: '' };
};

export const buildLoginSuccessMessage = (user, apiMessage) => {
  const name = user?.fullName?.trim();
  if (name) return `Đăng nhập thành công. Xin chào, ${name}!`;
  return apiMessage || 'Đăng nhập thành công.';
};

export const buildLogoutSuccessMessage = (user, apiMessage) => {
  const name = user?.fullName?.trim();
  if (name) return `Đăng xuất thành công. Hẹn gặp lại, ${name}!`;
  return apiMessage || 'Đăng xuất thành công.';
};

export const buildRegisterOtpSentMessage = (email, apiMessage) => {
  if (apiMessage && !apiMessage.toLowerCase().includes('thành công')) {
    return `Gửi OTP thành công: ${apiMessage}`;
  }
  return `Gửi OTP thành công. Mã xác thực đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư (kể cả mục Spam).`;
};

export const buildRegisterOtpResentMessage = (email) =>
  `Đã gửi lại mã OTP tới ${email}. Vui lòng kiểm tra hộp thư trong vòng 5 phút.`;

export const buildRegisterSuccessMessage = (user, apiMessage) => {
  const name = user?.fullName?.trim();
  const email = user?.email?.trim();
  if (name && email) {
    return `Đăng ký thành công. Tài khoản ${email} đã được kích hoạt. Xin chào, ${name}!`;
  }
  return apiMessage || 'Đăng ký tài khoản thành công!';
};
