import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface NoteDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  question?: Types.ObjectId;
  challenge?: Types.ObjectId;
  title: string;
  content: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<NoteDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", index: true },
    challenge: { type: Schema.Types.ObjectId, ref: "FrontendChallenge", index: true },
    title: { type: String, trim: true, maxlength: 200, default: "Untitled Note" },
    content: { type: String, maxlength: 20000, default: "" },
    isPrivate: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, maxlength: 30 }],
  },
  { timestamps: true },
);

noteSchema.index({ user: 1, question: 1 });
noteSchema.index({ user: 1, updatedAt: -1 });

export const Note: Model<NoteDoc> =
  (mongoose.models.Note as Model<NoteDoc>) ||
  mongoose.model<NoteDoc>("Note", noteSchema);
