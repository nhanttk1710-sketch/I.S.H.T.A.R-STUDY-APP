import { betterAuth } from "better-auth";
import { db } from "@/lib/db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be set to a random value of at least 32 characters.");
}

export const auth = betterAuth({
  database: db,
  secret,
  baseURL: process.env.BETTER_AUTH_URL || {
    allowedHosts: ["localhost:3000", "*.vercel.app"],
    protocol: process.env.NODE_ENV === "development" ? "http" : "https",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
