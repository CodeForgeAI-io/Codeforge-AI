import mongoose, { Schema, type Model, type Types } from "mongoose";

export type BookmarkKind = "question" | "challenge" | "discussion";

export interface BookmarkDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  kind: BookmarkKind;
  question?: Types.ObjectId;
  challenge?: Types.ObjectId;
  discussion?: Types.ObjectId;
  list: string;
  createdAt: Date;
}

const bookmarkSchema = new Schema<BookmarkDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["question", "challenge", "discussion"], required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question" },
    challenge: { type: Schema.Types.ObjectId, ref: "FrontendChallenge" },
    discussion: { type: Schema.Types.ObjectId, ref: "Discussion" },
    list: { type: String, default: "Saved", trim: true, maxlength: 60 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

bookmarkSchema.index({ user: 1, kind: 1 });
bookmarkSchema.index({ user: 1, question: 1 }, { unique: true, sparse: true });
bookmarkSchema.index({ user: 1, challenge: 1 }, { unique: true, sparse: true });
bookmarkSchema.index({ user: 1, discussion: 1 }, { unique: true, sparse: true });

export const Bookmark: Model<BookmarkDoc> =
  (mongoose.models.Bookmark as Model<BookmarkDoc>) ||
  mongoose.model<BookmarkDoc>("Bookmark", bookmarkSchema);
