import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface AiChatDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  context: "question" | "challenge" | "interview" | "general";
  question?: Types.ObjectId;
  challenge?: Types.ObjectId;
  messages: AiChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const aiChatSchema = new Schema<AiChatDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    context: {
      type: String,
      enum: ["question", "challenge", "interview", "general"],
      default: "general",
    },
    question: { type: Schema.Types.ObjectId, ref: "Question" },
    challenge: { type: Schema.Types.ObjectId, ref: "FrontendChallenge" },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

aiChatSchema.index({ user: 1, question: 1 });

export const AiChat: Model<AiChatDoc> =
  (mongoose.models.AiChat as Model<AiChatDoc>) ||
  mongoose.model<AiChatDoc>("AiChat", aiChatSchema);
