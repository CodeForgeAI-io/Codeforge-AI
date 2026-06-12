import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { Difficulty, FrontendTech } from "@/lib/constants";

export interface FrontendChallengeDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tech: FrontendTech;
  tags: string[];
  /** Short summary shown in lists */
  brief: string;
  /** Full markdown brief with requirements */
  description: string;
  /** Design / behavior spec the AI reviewer grades against */
  designSpec: string;
  /** file path -> starter code, e.g. "/index.html" or "/App.js" */
  starterFiles: Map<string, string>;
  checklist: string[];
  isPublished: boolean;
  createdBy?: Types.ObjectId;
  stats: { attempts: number; completed: number };
  createdAt: Date;
  updatedAt: Date;
}

const frontendChallengeSchema = new Schema<FrontendChallengeDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
      index: true,
    },
    tech: {
      type: String,
      enum: ["html-css", "javascript", "react", "react-tailwind"],
      required: true,
      index: true,
    },
    tags: { type: [String], default: [] },
    brief: { type: String, required: true, maxlength: 300 },
    description: { type: String, required: true },
    designSpec: { type: String, required: true },
    starterFiles: { type: Map, of: String, default: {} },
    checklist: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    stats: {
      attempts: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const FrontendChallenge: Model<FrontendChallengeDoc> =
  (mongoose.models.FrontendChallenge as Model<FrontendChallengeDoc>) ||
  mongoose.model<FrontendChallengeDoc>(
    "FrontendChallenge",
    frontendChallengeSchema,
  );
