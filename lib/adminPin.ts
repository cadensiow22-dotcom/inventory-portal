export const ADMIN_PIN = "667325";

export function verifyAdminPin(input: string | null) {
  if (!input) return false;
  return input.trim() === ADMIN_PIN;
}
