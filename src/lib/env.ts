import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get openaiKey() {
    return required("OPENAI_API_KEY");
  },
  /** Strong model for writing questions and challenges. */
  get openaiModel() {
    return process.env.OPENAI_MODEL || "gpt-5";
  },
  /** Cheaper model for grading and small repairs. */
  get openaiFastModel() {
    return process.env.OPENAI_FAST_MODEL || "gpt-5-mini";
  },
  get embeddingModel() {
    return process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  },
  get appPassword() {
    return required("APP_PASSWORD");
  },
  get authSecret() {
    const secret = required("AUTH_SECRET");
    if (secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters.");
    return secret;
  },
  /** IANA zone that decides when "today" rolls over. */
  get timezone() {
    return process.env.APP_TIMEZONE || "UTC";
  },
};
