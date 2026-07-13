import { connectDB } from "@/lib/mongodb";
import { BlogPost } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

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
