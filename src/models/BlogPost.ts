import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface BlogPostDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  content: string; // markdown body
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** Cover image stored inline (base64, no body) + its mime type. */
  coverData: string; // raw base64 (no data: prefix)
  coverMime: string; // e.g. image/jpeg
  author?: Types.ObjectId;
  status: "draft" | "published";
  views: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<BlogPostDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    coverData: { type: String, default: "" },
    coverMime: { type: String, default: "image/jpeg" },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const BlogPost =
  (mongoose.models.BlogPost as Model<BlogPostDoc>) ||
  mongoose.model<BlogPostDoc>("BlogPost", blogPostSchema);
