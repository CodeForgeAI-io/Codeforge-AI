import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface CompanyDoc {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description: string;
  /** lucide icon or emoji shown next to the company */
  logo: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<CompanyDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    logo: { type: String, default: "building-2" },
  },
  { timestamps: true },
);

export const Company: Model<CompanyDoc> =
  (mongoose.models.Company as Model<CompanyDoc>) ||
  mongoose.model<CompanyDoc>("Company", companySchema);
