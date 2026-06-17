import mongoose, { Schema } from "mongoose";

export interface SiteConfigDoc {
  _id: string;
  // SEO
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;
  twitterHandle: string;
  // Analytics
  gaId: string;
  clarityId: string;
  gscVerification: string;
  // SMTP
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  // AI
  groqApiKey: string;
  groqModel: string;
  // Execution
  executionProvider: string;
  judge0Url: string;
  judge0ApiKey: string;
  paizaUrl: string;
  paizaApiKey: string;
  pistonUrl: string;
  // Redis
  redisUrl: string;
  redisToken: string;
  // OAuth
  googleClientId: string;
  googleClientSecret: string;
  githubClientId: string;
  githubClientSecret: string;
  // Razorpay
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

const str = { type: String, default: "" };

const SiteConfigSchema = new Schema<SiteConfigDoc>(
  {
    _id: { type: String, required: true },
    siteUrl: str,
    siteName: str,
    siteDescription: str,
    siteKeywords: str,
    ogImage: str,
    twitterHandle: str,
    gaId: str,
    clarityId: str,
    gscVerification: str,
    smtpHost: str,
    smtpPort: { type: Number, default: 465 },
    smtpUser: str,
    smtpPass: str,
    smtpFrom: str,
    groqApiKey: str,
    groqModel: str,
    executionProvider: str,
    judge0Url: str,
    judge0ApiKey: str,
    paizaUrl: str,
    paizaApiKey: str,
    pistonUrl: str,
    redisUrl: str,
    redisToken: str,
    googleClientId: str,
    googleClientSecret: str,
    githubClientId: str,
    githubClientSecret: str,
    razorpayKeyId: str,
    razorpayKeySecret: str,
  },
  { timestamps: true },
);

export const SiteConfig =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mongoose.models.SiteConfig as mongoose.Model<any>) ??
  mongoose.model("SiteConfig", SiteConfigSchema);
