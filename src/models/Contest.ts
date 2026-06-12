import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { ContestType } from "@/lib/constants";

export interface ContestQuestionEntry {
  question: Types.ObjectId;
  points: number;
}

export interface ContestParticipant {
  user: Types.ObjectId;
  joinedAt: Date;
  /** total points from accepted contest submissions */
  score: number;
  /** total seconds from contest start to each accepted solve (tiebreaker) */
  penaltySeconds: number;
  solvedQuestionIds: string[];
  finished: boolean;
}

export interface ContestDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  type: ContestType;
  startsAt: Date;
  durationMinutes: number;
  questions: ContestQuestionEntry[];
  participants: ContestParticipant[];
  isPublished: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contestSchema = new Schema<ContestDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 150 },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["weekly", "daily", "custom"],
      default: "custom",
    },
    startsAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 600 },
    questions: [
      {
        question: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        points: { type: Number, default: 100 },
      },
    ],
    participants: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
        score: { type: Number, default: 0 },
        penaltySeconds: { type: Number, default: 0 },
        solvedQuestionIds: { type: [String], default: [] },
        finished: { type: Boolean, default: false },
      },
    ],
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Contest: Model<ContestDoc> =
  (mongoose.models.Contest as Model<ContestDoc>) ||
  mongoose.model<ContestDoc>("Contest", contestSchema);
