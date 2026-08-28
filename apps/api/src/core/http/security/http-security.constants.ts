export const HTTP_JSON_BODY_LIMIT_BYTES = 1_048_576;
export const HTTP_URLENCODED_BODY_LIMIT_BYTES = 1_048_576;

export const RATE_LIMIT_WINDOW_MS = 60_000;

export const RATE_LIMITS = {
  comments: { limit: 5, ttl: RATE_LIMIT_WINDOW_MS },
  contact: { limit: 5, ttl: RATE_LIMIT_WINDOW_MS },
  default: { limit: 300, ttl: RATE_LIMIT_WINDOW_MS },
  newsletter: { limit: 5, ttl: RATE_LIMIT_WINDOW_MS },
  postSearch: { limit: 60, ttl: RATE_LIMIT_WINDOW_MS },
  postViews: { limit: 30, ttl: RATE_LIMIT_WINDOW_MS },
  resendWebhook: { limit: 120, ttl: RATE_LIMIT_WINDOW_MS },
} as const;
