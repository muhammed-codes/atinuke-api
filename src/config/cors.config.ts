import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://bello-admin-tree.vercel.app",
  "https://atinukelineage.web.app/",
];

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "");

export const getAllowedOrigins = () => {
  const envOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS?.split(",") || []),
  ]
    .filter((origin): origin is string => Boolean(origin))
    .map(normalizeOrigin);

  return [...new Set([...defaultAllowedOrigins, ...envOrigins])];
};

export const corsOptions: CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    if (getAllowedOrigins().includes(normalizeOrigin(requestOrigin))) {
      callback(null, requestOrigin);
      return;
    }

    callback(null, false);
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Requested-With",
  ],
  optionsSuccessStatus: 204,
};
