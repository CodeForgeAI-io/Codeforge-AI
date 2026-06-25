/**
 * Barrel that registers every model with Mongoose. Import models from here
 * so `populate()` calls never hit an unregistered schema.
 */
export { User, type UserDoc } from "./User";
export {
  Question,
  type QuestionDoc,
  type QuestionTestCase,
  type QuestionExample,
} from "./Question";
export {
  FrontendChallenge,
  type FrontendChallengeDoc,
} from "./FrontendChallenge";
export {
  Submission,
  type SubmissionDoc,
  type SubmissionTestResult,
} from "./Submission";
export {
  Roadmap,
  type RoadmapDoc,
  type RoadmapSection,
  type RoadmapTopic,
} from "./Roadmap";
export { Progress, type ProgressDoc } from "./Progress";
export {
  Contest,
  type ContestDoc,
  type ContestParticipant,
} from "./Contest";
export { Badge, type BadgeDoc } from "./Badge";
export { UserBadge, type UserBadgeDoc } from "./UserBadge";
export { Company, type CompanyDoc } from "./Company";
export { AiChat, type AiChatDoc, type AiChatMessage } from "./AiChat";
export { AiToolRun, type AiToolRunDoc } from "./AiToolRun";
export { AiUsage, type AiUsageDoc } from "./AiUsage";
export { Subscription, type SubscriptionDoc } from "./Subscription";
export { FeatureAccess, type FeatureAccessDoc } from "./FeatureAccess";
export { GenUsage, type GenUsageDoc } from "./GenUsage";
export { PromptTemplate, type PromptTemplateDoc } from "./PromptTemplate";
export { DailyActivity, type DailyActivityDoc } from "./DailyActivity";
export { Discussion, type DiscussionDoc, type DiscussionReply } from "./Discussion";
export { Note, type NoteDoc } from "./Note";
export { Bookmark, type BookmarkDoc, type BookmarkKind } from "./Bookmark";
export { Follow, type FollowDoc } from "./Follow";
export { SpacedRepetition, type SpacedRepetitionDoc } from "./SpacedRepetition";
export { SiteConfig, type SiteConfigDoc } from "./SiteConfig";
