import mongoose, { Schema, type Model } from "mongoose";

export interface FeatureAccessDoc {
  _id: string; // always "global"
  /** featureId -> minimum plan ("free" | "go" | "plus") */
  access: Record<string, string>;
  updatedAt: Date;
}

const featureAccessSchema = new Schema<FeatureAccessDoc>(
  {
    _id: { type: String, required: true },
    access: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export const FeatureAccess =
  (mongoose.models.FeatureAccess as Model<FeatureAccessDoc>) ||
  mongoose.model<FeatureAccessDoc>("FeatureAccess", featureAccessSchema);
