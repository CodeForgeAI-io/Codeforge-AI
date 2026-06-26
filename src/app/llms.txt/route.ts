import { getEffectiveConfig } from "@/lib/site-config";
import { DOC_ARTICLES, DOC_CATEGORIES } from "@/content/docs";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * llms.txt — a machine-readable guide for LLMs/agents discovering the site.
 * Spec: https://llmstxt.org
 */
export async function GET() {
  const cfg = await getEffectiveConfig();
  const base = (cfg.siteUrl || "https://codeforgeai.io").replace(/\/$/, "");

  const docLines = DOC_CATEGORIES.flatMap((cat) => {
    const items = DOC_ARTICLES.filter((a) => a.category === cat.id);
    if (items.length === 0) return [];
    return [
      `\n### ${cat.title}`,
      ...items.map((a) => `- [${a.title}](${base}/help/${a.slug}): ${a.description}`),
    ];
  });

  const body = `# ${APP_NAME}

> ${APP_DESCRIPTION}

${APP_NAME} (codeforgeai.io), by Setups Works, is an AI-powered coding-interview
preparation platform: a 12-language compiler and editor, an AI Mentor, an AI tools
suite, spaced repetition, skill analytics, contests, company prep, and a community.

## Key pages
- [Home](${base}/): product overview
- [Problems](${base}/problems): the DSA problem bank
- [Compiler](${base}/compiler): run code in 12 languages with custom input
- [Pricing](${base}/pricing): Free, Go and Plus plans
- [Blog](${base}/blog): feature deep-dives and product updates
- [Changelog](${base}/changelog): release history
- [About](${base}/about): company and team
- [Contact](${base}/contact): support — info@codeforgeai.io

## API
- [Interactive API docs](${base}/docs): OpenAPI/Swagger explorer (admin)
- REST API under ${base}/api ; protected endpoints use a session cookie.

## Documentation
${docLines.join("\n")}

## Contact
- Email: info@codeforgeai.io
- Company: Setups Works
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
