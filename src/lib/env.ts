import { z } from "zod";

const envSchema = z.object({
  GOOGLE_API_KEY: z.string().min(1, "GOOGLE_API_KEY is required"),
  COPILOT_API_URL: z.string().url().default("http://localhost:4141/v1"),
  COPILOT_API_KEY: z.string().min(1, "COPILOT_API_KEY is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

export const env = getEnv();
