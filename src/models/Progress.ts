import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { RoadmapTrack } from "@/lib/constants";

export interface ProgressDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  track: RoadmapTrack;
  /** topic key -> accepted solve count toward that topic */
  topicSolves: Map<string, number>;
  completedTopics: string[];
  percent: number;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<ProgressDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    track: { type: String, enum: ["dsa", "frontend"], required: true },
    topicSolves: { type: Map, of: Number, default: {} },
    completedTopics: { type: [String], default: [] },
    percent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

progressSchema.index({ user: 1, track: 1 }, { unique: true });

export const Progress: Model<ProgressDoc> =
  (mongoose.models.Progress as Model<ProgressDoc>) ||
  mongoose.model<ProgressDoc>("Progress", progressSchema);
