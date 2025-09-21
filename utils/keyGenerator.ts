
export const generateKey = (prefix: string, pattern: number[]): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];

  const segments = pattern.map(len =>
    Array.from({ length: len }, pick).join("")
  );

  return `${prefix}-${segments.join("-")}`;
};
