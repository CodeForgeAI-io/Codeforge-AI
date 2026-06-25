import mongoose, { Schema, type Model } from "mongoose";

/**
 * Idempotency ledger for Razorpay webhooks. The Razorpay event id is the _id,
 * so a duplicate delivery fails the unique insert and is safely ignored.
 */
export interface WebhookEventDoc {
  _id: string; // Razorpay x-razorpay-event-id
  event: string; // event type, e.g. "subscription.charged"
  createdAt: Date;
}

const webhookEventSchema = new Schema<WebhookEventDoc>(
  {
    _id: { type: String, required: true },
    event: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Auto-expire processed events after 30 days to keep the collection small.
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const WebhookEvent =
  (mongoose.models.WebhookEvent as Model<WebhookEventDoc>) ||
  mongoose.model<WebhookEventDoc>("WebhookEvent", webhookEventSchema);
