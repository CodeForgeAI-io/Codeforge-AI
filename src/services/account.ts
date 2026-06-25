import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  User,
  AiChat,
  AiToolRun,
  AiUsage,
  GenUsage,
  Bookmark,
  CouponRedemption,
  DailyActivity,
  Note,
  Progress,
  SpacedRepetition,
  Submission,
  Subscription,
  UserBadge,
  Follow,
  Discussion,
} from "@/models";
import { getRazorpay, paymentsEnabled } from "@/lib/razorpay";

/** Best-effort: stop any live Razorpay auto-pay before removing the account. */
async function cancelActiveSubscription(userId: Types.ObjectId): Promise<void> {
  if (!paymentsEnabled()) return;
  const user = await User.findById(userId).select("razorpaySubscriptionId").lean();
  if (!user?.razorpaySubscriptionId) return;
  try {
    await getRazorpay().subscriptions.cancel(user.razorpaySubscriptionId, false);
  } catch (e) {
    console.error("[account] failed to cancel subscription on delete:", e);
  }
}

/**
 * Permanently delete a user and the data they own. Shared content (published
 * questions/challenges/contests) is intentionally left intact. Returns false if
 * the user no longer exists.
 */
export async function deleteUserAndData(userId: string): Promise<boolean> {
  await connectDB();
  const _id = new Types.ObjectId(userId);

  const user = await User.findById(_id).select("_id");
  if (!user) return false;

  await cancelActiveSubscription(_id);

  await Promise.all([
    AiChat.deleteMany({ user: _id }),
    AiToolRun.deleteMany({ user: _id }),
    AiUsage.deleteMany({ user: _id }),
    GenUsage.deleteMany({ user: _id }),
    Bookmark.deleteMany({ user: _id }),
    CouponRedemption.deleteMany({ user: _id }),
    DailyActivity.deleteMany({ user: _id }),
    Note.deleteMany({ user: _id }),
    Progress.deleteMany({ user: _id }),
    SpacedRepetition.deleteMany({ user: _id }),
    Submission.deleteMany({ user: _id }),
    Subscription.deleteMany({ user: _id }),
    UserBadge.deleteMany({ user: _id }),
    Follow.deleteMany({ $or: [{ follower: _id }, { following: _id }] }),
    Discussion.deleteMany({ author: _id }),
  ]);

  await User.findByIdAndDelete(_id);
  return true;
}
