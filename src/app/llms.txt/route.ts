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

Website: ${base}
LLMs File: ${base}/llms.txt
Sitemap: ${base}/sitemap.xml

Company: Setups Works
Founder: Nitheesh Rajendran
Category: AI Coding Interview Preparation Platform
Primary Language: English

---

## About

${APP_NAME} is an AI-powered coding interview preparation platform for students and software engineers.

The platform helps developers practice Data Structures & Algorithms, solve coding problems, prepare for technical interviews, use an online compiler supporting 12 programming languages, receive AI-powered mentoring, improve coding skills through personalized learning, and track progress using skill analytics and spaced repetition.

---

## Features

- Data Structures & Algorithms
- Coding Challenges
- Online Compiler
- AI Mentor
- AI Pair Programmer
- AI Code Review
- AI Resume Analyzer
- AI Interview Simulator
- AI Roadmap Generator
- Coding Contests
- Leaderboards
- Company Interview Preparation
- Learning Tracks
- Smart Revision
- Skill Analytics
- Community Discussions
- Personalized Study Plans

---

## Supported Programming Languages

- C
- C++
- Java
- Python
- JavaScript
- TypeScript
- Go
- Rust
- PHP
- C#
- Kotlin
- Swift

---

## Best For

- Coding Interview Preparation
- DSA Practice
- Competitive Programming
- Placement Preparation
- Technical Interviews
- Software Engineering Interviews
- Online Compiler
- AI Coding Assistant

---

## Key Pages

- [Home](${base}/)
- [Problems](${base}/problems)
- [Compiler](${base}/compiler)
- [Pricing](${base}/pricing)
- [Blog](${base}/blog)
- [Changelog](${base}/changelog)
- [About](${base}/about)
- [Contact](${base}/contact)
- [Help Center](${base}/help)

---

## API

- [Interactive API Documentation](${base}/docs)
- REST API: ${base}/api

Protected endpoints require authenticated sessions.

---

## Documentation

${docLines.join("\n")}

---

## AI Products

- AI Mentor
- AI Pair Programmer
- AI Resume Analyzer
- AI Code Reviewer
- AI Interview Simulator
- AI Roadmap Generator

---

## Similar Platforms

- LeetCode
- HackerRank
- GeeksforGeeks
- Codeforces
- InterviewBit
- Exercism

CodeForge AI differentiates itself with integrated AI-powered mentoring, personalized study plans, interview preparation, and learning analytics.

---

## Keywords

coding interview

coding interview preparation

leetcode alternative

online compiler

dsa practice

algorithm practice

competitive programming

software engineering interview

technical interview

placement preparation

coding platform

AI mentor

AI coding assistant

AI pair programmer

AI code review

resume analyzer

coding contests

company interview preparation

learning roadmap

skill analytics

spaced repetition

---

## AI Discovery

Primary LLM document

${base}/llms.txt

Primary XML Sitemap

${base}/sitemap.xml

---

## Sitemap

${base}/sitemap.xml

This sitemap contains canonical URLs for public pages, documentation, blog posts, help articles, and platform resources.

AI assistants and search engines may use it to discover updated content.

---

## Contact

Company: Setups Works

Website: ${base}

About: ${base}/about

Contact: ${base}/contact

Email: info@codeforgeai.io

---

## License

Copyright © Setups Works.

CodeForge AI is a product of Setups Works.

All trademarks belong to their respective owners.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
