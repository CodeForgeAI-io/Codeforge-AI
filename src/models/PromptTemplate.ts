import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface PromptTemplateDoc {
  _id: Types.ObjectId;
  key: string;
  name: string;
  description: string;
  /** Template body; supports {{placeholder}} interpolation */
  template: string;
  temperature: number;
  maxTokens: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promptTemplateSchema = new Schema<PromptTemplateDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    template: { type: String, required: true },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 2048, min: 64, max: 32768 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const PromptTemplate: Model<PromptTemplateDoc> =
  (mongoose.models.PromptTemplate as Model<PromptTemplateDoc>) ||
  mongoose.model<PromptTemplateDoc>("PromptTemplate", promptTemplateSchema);
