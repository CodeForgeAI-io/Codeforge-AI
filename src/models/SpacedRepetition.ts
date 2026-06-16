import mongoose, { Schema, type Model, type Types } from "mongoose";

export type SRQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SpacedRepetitionDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  question: Types.ObjectId;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: Date;
  lastReview?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const srSchema = new Schema<SpacedRepetitionDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    interval: { type: Number, default: 1 },
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    nextReview: { type: Date, default: Date.now },
    lastReview: { type: Date },
  },
  { timestamps: true },
);

srSchema.index({ user: 1, question: 1 }, { unique: true });
srSchema.index({ user: 1, nextReview: 1 });

export const SpacedRepetition: Model<SpacedRepetitionDoc> =
  (mongoose.models.SpacedRepetition as Model<SpacedRepetitionDoc>) ||
  mongoose.model<SpacedRepetitionDoc>("SpacedRepetition", srSchema);
