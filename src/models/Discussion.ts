import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface DiscussionReply {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionDoc {
  _id: Types.ObjectId;
  question?: Types.ObjectId;
  challenge?: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  kind: "discussion" | "solution" | "question";
  language?: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  replies: DiscussionReply[];
  isPinned: boolean;
  aiSummary?: string;
  aiSummaryAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<DiscussionReply>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 5000 },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const discussionSchema = new Schema<DiscussionDoc>(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", index: true },
    challenge: { type: Schema.Types.ObjectId, ref: "FrontendChallenge", index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 10000 },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    kind: { type: String, enum: ["discussion", "solution", "question"], default: "discussion" },
    language: { type: String },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replies: [replySchema],
    isPinned: { type: Boolean, default: false },
    aiSummary: { type: String },
    aiSummaryAt: { type: Date },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

discussionSchema.index({ question: 1, createdAt: -1 });
discussionSchema.index({ author: 1, createdAt: -1 });

export const Discussion: Model<DiscussionDoc> =
  (mongoose.models.Discussion as Model<DiscussionDoc>) ||
  mongoose.model<DiscussionDoc>("Discussion", discussionSchema);
