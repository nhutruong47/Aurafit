const VIETNAMESE_ACCENT_REGEX =
  /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
const NON_LATIN_SCRIPT_REGEX = /[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;

const VI_HINTS = new Set([
  'ao',
  'ban',
  'bo',
  'can',
  'cho',
  'co',
  'con',
  'costume',
  'de',
  'dip',
  'do',
  'goi',
  'gia',
  'hang',
  'hop',
  'hoi',
  'khoang',
  'mau',
  'minh',
  'muon',
  'ngan',
  'phu',
  'sach',
  'size',
  'su',
  'thue',
  'tim',
  'toi',
  'trang',
  'tu',
  'tuong',
  'ung',
  'vay',
  'voi',
  'yeu',
  'y',
]);

const EN_HINTS = new Set([
  'a',
  'an',
  'budget',
  'color',
  'costume',
  'dress',
  'event',
  'for',
  'hello',
  'help',
  'hi',
  'i',
  'looking',
  'me',
  'my',
  'need',
  'outfit',
  'party',
  'please',
  'price',
  'recommend',
  'rent',
  'rental',
  'show',
  'size',
  'suggest',
  'suit',
  'thanks',
  'want',
  'wedding',
  'with',
]);

const normalizeForDetection = (message) => {
  if (!message) return '';

  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const countHints = (tokens, hints) => tokens.reduce((score, token) => score + (hints.has(token) ? 1 : 0), 0);

export const detectChatReplyLanguage = (message) => {
  if (!message?.trim()) {
    return 'vi';
  }

  if (VIETNAMESE_ACCENT_REGEX.test(message)) {
    return 'vi';
  }

  if (NON_LATIN_SCRIPT_REGEX.test(message)) {
    return 'other';
  }

  const normalized = normalizeForDetection(message);
  if (!normalized) {
    return 'vi';
  }

  const tokens = normalized.split(' ');
  const viScore = countHints(tokens, VI_HINTS);
  const enScore = countHints(tokens, EN_HINTS);

  if (enScore >= 2 && enScore > viScore) {
    return 'en';
  }

  if (viScore >= 1) {
    return 'vi';
  }

  if (enScore === 1 && tokens.length <= 3) {
    return 'en';
  }

  return 'other';
};

export const getChatTypingText = (language) =>
  language === 'vi' ? 'AI đang trả lời...' : 'AI is typing...';

export const getChatAssistantErrorMessage = (language) =>
  language === 'vi'
    ? 'Xin lỗi, AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé.'
    : 'Sorry, the AI assistant is having trouble right now. Please try again later.';

export const buildPricePromptMessage = (language, productName, productPrice) =>
  language === 'vi'
    ? `Mình muốn được AI Stylist tư vấn giá và gợi ý costume phù hợp với "${productName}" (${productPrice}).`
    : `I'd like pricing advice and costume suggestions related to "${productName}" (${productPrice}).`;
