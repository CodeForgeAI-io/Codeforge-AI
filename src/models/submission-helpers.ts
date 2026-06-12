import { SUBMISSION_STATUSES } from "@/lib/constants";

export { Submission } from "./Submission";

/** Mutable copy for runtime `.includes()` checks against query strings */
export const SUBMISSION_STATUSES_GUARD: string[] = [...SUBMISSION_STATUSES];
