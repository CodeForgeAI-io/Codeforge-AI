import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface UserStats {
  xp: number;
  level: number;
  solved: { easy: number; medium: number; hard: number; total: number };
  frontendCompleted: number;
  streak: {
    current: number;
    longest: number;
    /** YYYY-MM-DD of last day with an accepted submission */
    lastActiveDate: string | null;
  };
}

export interface UserPreferences {
  editorFontSize: number;
  editorTheme: "vs-dark" | "light";
  vimMode: boolean;
  defaultLanguage: string;
}

export interface UserOnboarding {
  completed: boolean;
  goal?: string;
  level?: string;
  topics: string[];
  companies: string[];
  dailyGoal: number;
  completedAt?: Date;
}

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  password?: string | null;
  image?: string | null;
  role: "user" | "admin";
  providers: string[];
  banned: boolean;
  bio?: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  stats: UserStats;
  preferences: UserPreferences;
  onboarding: UserOnboarding;
  plan: "free" | "go" | "plus";
  planExpiresAt?: Date | null;
  trialEndsAt?: Date | null;
  billingCycle?: "monthly" | "yearly" | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, default: null, select: false },
    image: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    providers: { type: [String], default: ["credentials"] },
    banned: { type: Boolean, default: false },
    bio: { type: String, maxlength: 300 },
    location: { type: String, maxlength: 100 },
    website: { type: String, maxlength: 200 },
    githubUrl: { type: String, maxlength: 200 },
    linkedinUrl: { type: String, maxlength: 200 },
    stats: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      solved: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      frontendCompleted: { type: Number, default: 0 },
      streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastActiveDate: { type: String, default: null },
      },
    },
    preferences: {
      editorFontSize: { type: Number, default: 14 },
      editorTheme: { type: String, default: "vs-dark" },
      vimMode: { type: Boolean, default: false },
      defaultLanguage: { type: String, default: "javascript" },
    },
    onboarding: {
      completed: { type: Boolean, default: false },
      goal: { type: String },
      level: { type: String },
      topics: { type: [String], default: [] },
      companies: { type: [String], default: [] },
      dailyGoal: { type: Number, default: 3 },
      completedAt: { type: Date },
    },
    plan: { type: String, enum: ["free", "go", "plus"], default: "free" },
    planExpiresAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    billingCycle: { type: String, enum: ["monthly", "yearly", null], default: null },
  },
  { timestamps: true },
);

userSchema.index({ "stats.xp": -1 });

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema);
