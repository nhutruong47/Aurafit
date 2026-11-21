const STYLIST_AVATAR_SRC = '/Cartoon%20Style%20Robot.webp';

export default function StylistAvatar({ className = '', alt = 'Robot AuraFit Stylist' }) {
  return (
    <img
      src={STYLIST_AVATAR_SRC}
      alt={alt}
      className={`rounded-full object-cover object-[center_28%] ${className}`}
     loading="lazy" decoding="async" />
  );
}
