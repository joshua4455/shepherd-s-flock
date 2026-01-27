export const queryKeys = {
  members: ['members'] as const,
  visitors: ['visitors'] as const,
  converts: ['converts'] as const,
  profiles: ['profiles'] as const,
  notifications: ['notifications'] as const,
  notificationFeed: ['notificationFeed'] as const,
};

export function delay(ms = 150) {
  return new Promise((res) => setTimeout(res, ms));
}
