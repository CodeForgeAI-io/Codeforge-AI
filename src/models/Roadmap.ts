import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { RoadmapTrack } from "@/lib/constants";

export interface RoadmapTopic {
  key: string;
  title: string;
  description: string;
  /** Question categories/tags that count toward this topic */
  matchTags: string[];
  /** Number of accepted solves required to complete the topic */
  requiredSolves: number;
}

export interface RoadmapSection {
  key: string;
  title: string;
  tier: "Beginner" | "Intermediate" | "Advanced";
  topics: RoadmapTopic[];
}

export interface RoadmapDoc {
  _id: Types.ObjectId;
  track: RoadmapTrack;
  title: string;
  description: string;
  sections: RoadmapSection[];
  createdAt: Date;
  updatedAt: Date;
}

const roadmapSchema = new Schema<RoadmapDoc>(
  {
    track: {
      type: String,
      enum: ["dsa", "frontend"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sections: [
      {
        key: { type: String, required: true },
        title: { type: String, required: true },
        tier: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced"],
          required: true,
        },
        topics: [
          {
            key: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String, default: "" },
            matchTags: { type: [String], default: [] },
            requiredSolves: { type: Number, default: 3 },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

export const Roadmap: Model<RoadmapDoc> =
  (mongoose.models.Roadmap as Model<RoadmapDoc>) ||
  mongoose.model<RoadmapDoc>("Roadmap", roadmapSchema);
