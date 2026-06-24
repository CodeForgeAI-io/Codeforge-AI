import mongoose, { Schema, type Model, type Types } from "mongoose";

/** A saved run of an AI tool (e.g. a generated roadmap, resume review, chat). */
export interface AiToolRunDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  /** Tool id: coach | pair | study | complexity | code | roadmap | contest | resume | project */
  tool: string;
  /** Short human label for the run (shown in the history list). */
  title: string;
  /** Input params (for context / future re-run). */
  input?: unknown;
  /** Generated output — used to reload the run into the tool. */
  result: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const aiToolRunSchema = new Schema<AiToolRunDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tool: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    input: { type: Schema.Types.Mixed },
    result: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

aiToolRunSchema.index({ user: 1, tool: 1, createdAt: -1 });

export const AiToolRun: Model<AiToolRunDoc> =
  (mongoose.models.AiToolRun as Model<AiToolRunDoc>) ||
  mongoose.model<AiToolRunDoc>("AiToolRun", aiToolRunSchema);
