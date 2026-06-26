import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface JobApplicationDoc {
  _id: Types.ObjectId;
  role: string; // career slug
  roleTitle: string;
  name: string;
  email: string;
  phone?: string;
  link?: string; // GitHub / portfolio / LinkedIn
  message: string;
  status: "new" | "reviewing" | "shortlisted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const jobApplicationSchema = new Schema<JobApplicationDoc>(
  {
    role: { type: String, required: true, index: true },
    roleTitle: { type: String, default: "" },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    link: { type: String, default: "" },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "reviewing", "shortlisted", "rejected"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

export const JobApplication =
  (mongoose.models.JobApplication as Model<JobApplicationDoc>) ||
  mongoose.model<JobApplicationDoc>("JobApplication", jobApplicationSchema);
