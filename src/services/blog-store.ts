import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { BlogPost } from "@/models";
import { uniqueSlug } from "@/lib/slug";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor, toUuidOrNull } from "@/lib/data-backend";

const be = () => backendFor("blog");

/** Blog post shaped like the Mongo lean doc the pages/components consume. */
export interface BlogPostView {
  _id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  status: string;
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SbBlogRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  status: string;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const SB_COLS =
  "id,slug,title,description,content,tags,seo_title,seo_description,seo_keywords,status,views,published_at,created_at,updated_at";

function fromRow(r: SbBlogRow): BlogPostView {
  return {
    _id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    content: r.content,
    tags: r.tags ?? [],
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    seoKeywords: r.seo_keywords,
    status: r.status,
    views: r.views,
    publishedAt: r.published_at ? new Date(r.published_at) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

/** Published posts for the blog index (no cover bytes). */
export async function listPublishedPosts(limit: number): Promise<BlogPostView[]> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("blog_posts")
      .select(SB_COLS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as SbBlogRow[]).map(fromRow);
  }
  await connectDB();
  const posts = await BlogPost.find({ status: "published" })
    .select("-coverData")
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return posts.map((p) => ({
    _id: p._id.toString(),
    slug: p.slug,
    title: p.title,
    description: p.description,
    content: p.content,
    tags: p.tags ?? [],
    seoTitle: p.seoTitle ?? null,
    seoDescription: p.seoDescription ?? null,
    seoKeywords: p.seoKeywords ?? null,
    status: p.status,
    views: p.views ?? 0,
    publishedAt: p.publishedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

/** A single published post by slug (no cover bytes). */
export async function getPublishedPost(slug: string): Promise<BlogPostView | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("blog_posts")
      .select(SB_COLS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return data ? fromRow(data as SbBlogRow) : null;
  }
  await connectDB();
  const p = await BlogPost.findOne({ slug, status: "published" }).select("-coverData").lean();
  if (!p) return null;
  return {
    _id: p._id.toString(),
    slug: p.slug,
    title: p.title,
    description: p.description,
    content: p.content,
    tags: p.tags ?? [],
    seoTitle: p.seoTitle ?? null,
    seoDescription: p.seoDescription ?? null,
    seoKeywords: p.seoKeywords ?? null,
    status: p.status,
    views: p.views ?? 0,
    publishedAt: p.publishedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Best-effort view increment. */
export async function incrementBlogViews(slug: string): Promise<void> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb.from("blog_posts").select("views").eq("slug", slug).maybeSingle();
    const views = ((data as { views: number } | null)?.views ?? 0) + 1;
    await sb.from("blog_posts").update({ views }).eq("slug", slug);
    return;
  }
  await connectDB();
  await BlogPost.updateOne({ slug }, { $inc: { views: 1 } });
}

/** Published slugs + last-modified for the sitemap. */
export async function listPublishedSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("blog_posts")
      .select("slug,updated_at")
      .eq("status", "published");
    return ((data ?? []) as { slug: string; updated_at: string }[]).map((p) => ({
      slug: p.slug,
      updatedAt: new Date(p.updated_at),
    }));
  }
  await connectDB();
  const posts = await BlogPost.find({ status: "published" }, "slug updatedAt").lean<{ slug: string; updatedAt: Date }[]>();
  return posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

// ── Admin ────────────────────────────────────────────────────────────────

export interface AdminBlogListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  views: number;
  coverMime: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

/** All posts (drafts included, no cover bytes) for the admin list. */
export async function adminListPosts(limit: number): Promise<AdminBlogListItem[]> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("blog_posts")
      .select("id,slug,title,description,tags,status,views,cover_mime,published_at,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as {
      id: string; slug: string; title: string; description: string; tags: string[] | null;
      status: string; views: number; cover_mime: string | null; published_at: string | null; created_at: string;
    }[]).map((p) => ({
      id: p.id, slug: p.slug, title: p.title, description: p.description, tags: p.tags ?? [],
      status: p.status, views: p.views, coverMime: p.cover_mime,
      publishedAt: p.published_at ? new Date(p.published_at) : null, createdAt: new Date(p.created_at),
    }));
  }
  await connectDB();
  const posts = await BlogPost.find().select("-coverData").sort({ createdAt: -1 }).limit(limit).lean();
  return posts.map((p) => ({
    id: p._id.toString(), slug: p.slug, title: p.title, description: p.description, tags: p.tags ?? [],
    status: p.status, views: p.views ?? 0, coverMime: p.coverMime ?? null,
    publishedAt: p.publishedAt ?? null, createdAt: p.createdAt,
  }));
}

export interface CreateBlogPost {
  title: string;
  description: string;
  content: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  coverData: string;
  coverMime: string;
  authorId: string;
  status: string;
}

/** Create a blog post, generating a unique slug. Returns id + slug. */
export async function createBlogPost(input: CreateBlogPost): Promise<{ id: string; slug: string }> {
  const publishedAt = input.status === "published" ? new Date() : null;
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const slug = await uniqueSlug(input.title, async (s) => {
      const { data } = await sb.from("blog_posts").select("id").eq("slug", s).maybeSingle();
      return Boolean(data);
    });
    const { data, error } = await sb.from("blog_posts").insert({
      slug, title: input.title, description: input.description, content: input.content, tags: input.tags,
      seo_title: input.seoTitle, seo_description: input.seoDescription, seo_keywords: input.seoKeywords,
      cover_data: input.coverData, cover_mime: input.coverMime, author_id: toUuidOrNull(input.authorId),
      status: input.status, published_at: publishedAt ? publishedAt.toISOString() : null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: (data as { id: string }).id, slug };
  }
  await connectDB();
  const slug = await uniqueSlug(input.title, async (s) => !!(await BlogPost.exists({ slug: s })));
  const post = new BlogPost({
    slug, title: input.title, description: input.description, content: input.content, tags: input.tags,
    seoTitle: input.seoTitle, seoDescription: input.seoDescription, seoKeywords: input.seoKeywords,
    coverData: input.coverData, coverMime: input.coverMime, author: input.authorId,
    status: input.status, publishedAt,
  });
  await post.save();
  return { id: post._id.toString(), slug };
}

export interface BlogPatch {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  coverData?: string;
  coverMime?: string;
  status?: string;
  publishedAt?: Date;
}

const BLOG_FIELD_MAP: Record<keyof BlogPatch, string> = {
  title: "title", description: "description", content: "content", tags: "tags",
  seoTitle: "seo_title", seoDescription: "seo_description", seoKeywords: "seo_keywords",
  coverData: "cover_data", coverMime: "cover_mime", status: "status", publishedAt: "published_at",
};

/** True when the post has no publishedAt yet (to stamp it on first publish). */
export async function blogNeedsPublishedAt(id: string): Promise<boolean> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin().from("blog_posts").select("published_at").eq("id", id).maybeSingle();
    return data ? !(data as { published_at: string | null }).published_at : false;
  }
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return false;
  const existing = await BlogPost.findById(id).select("publishedAt").lean();
  return existing ? !existing.publishedAt : false;
}

/** Update a blog post by id. Returns false if not found. */
export async function updateBlogPost(id: string, patch: BlogPatch): Promise<boolean> {
  if (be() === "supabase") {
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      row[BLOG_FIELD_MAP[k as keyof BlogPatch]] = v instanceof Date ? v.toISOString() : v;
    }
    if (!Object.keys(row).length) return true;
    const { data, error } = await supabaseAdmin().from("blog_posts").update(row).eq("id", id).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  }
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return false;
  const res = await BlogPost.updateOne({ _id: id }, { $set: patch });
  return res.matchedCount > 0;
}

/** Delete a blog post by id. */
export async function deleteBlogPost(id: string): Promise<void> {
  if (be() === "supabase") {
    await supabaseAdmin().from("blog_posts").delete().eq("id", id);
    return;
  }
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return;
  await BlogPost.deleteOne({ _id: id });
}
