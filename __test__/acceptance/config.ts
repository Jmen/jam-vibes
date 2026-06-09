export const config = {
  baseUrl: process.env.ACCEPTANCE_BASE_URL ?? "http://localhost:3000",
  mailpitUrl: process.env.MAILPIT_URL ?? "http://127.0.0.1:55324",
};
