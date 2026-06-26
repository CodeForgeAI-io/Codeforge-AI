import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface JobApplicationDoc {
  _id: Types.ObjectId;
  role: string; // career slug
  roleTitle: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  experience?: string; // years of experience
  company?: string; // current company (optional)
  resumeUrl?: string; // Vercel Blob URL
  resumeName?: string;
  message?: string;
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
    location: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    experience: { type: String, default: "" },
    company: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumeName: { type: String, default: "" },
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
