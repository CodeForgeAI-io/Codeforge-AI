/**
 * Minimal GitHub Issues integration via the REST API (no extra dependency).
 *
 * Configure with env vars:
 *   GITHUB_FEEDBACK_TOKEN  — a Personal Access Token (classic: `repo` scope,
 *                            or fine-grained: Issues read/write on the repo)
 *   GITHUB_FEEDBACK_REPO   — "owner/name", e.g. "CodeForgeAI-io/Codeforge-AI"
 *
 * If the token isn't set, issue creation is skipped (the caller can fall back
 * to email) and `isGithubFeedbackEnabled()` returns false.
 */

const DEFAULT_REPO = "CodeForgeAI-io/Codeforge-AI";

export function isGithubFeedbackEnabled(): boolean {
  return Boolean(process.env.GITHUB_FEEDBACK_TOKEN);
}

function getRepo(): { owner: string; repo: string } | null {
  const slug = process.env.GITHUB_FEEDBACK_REPO?.trim() || DEFAULT_REPO;
  const [owner, repo] = slug.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
}

export interface CreateIssueInput {
  title: string;
  body: string;
  labels?: string[];
}

export interface CreatedIssue {
  number: number;
  url: string;
}

/** Create a GitHub issue. Throws on failure so the caller can decide fallback. */
export async function createIssue({
  title,
  body,
  labels,
}: CreateIssueInput): Promise<CreatedIssue> {
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  if (!token) throw new Error("GITHUB_FEEDBACK_TOKEN is not set");

  const target = getRepo();
  if (!target) throw new Error("GITHUB_FEEDBACK_REPO is invalid (expected owner/name)");

  const res = await fetch(
    `https://api.github.com/repos/${target.owner}/${target.repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "codeforge-ai-feedback",
      },
      body: JSON.stringify({ title, body, labels }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub issue creation failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { number: number; html_url: string };
  return { number: data.number, url: data.html_url };
}
