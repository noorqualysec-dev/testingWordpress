import { notFound } from "next/navigation";

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
    }>;
  };
}

const WORDPRESS_API_BASE = "https://qualysec.com/wp-json/wp/v2";
const REVALIDATE_SECONDS = 60;

export function getFeaturedImage(post: WPPost) {
  return post._embedded?.["wp:featuredmedia"]?.[0];
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export async function getLatestPosts(count = 10) {
  const url = new URL(`${WORDPRESS_API_BASE}/posts`);
  url.searchParams.set("per_page", String(count));
  url.searchParams.set("orderby", "date");
  url.searchParams.set("order", "desc");
  url.searchParams.set("_embed", "1");

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

  if (!res.ok) {
    throw new Error("Failed to load WordPress posts");
  }

  return (await res.json()) as WPPost[];
}

export async function getPostBySlug(slug: string) {
  const url = new URL(`${WORDPRESS_API_BASE}/posts`);
  url.searchParams.set("slug", slug);
  url.searchParams.set("_embed", "1");

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

  if (!res.ok) {
    notFound();
  }

  const posts = (await res.json()) as WPPost[];

  if (!posts.length) {
    notFound();
  }

  return posts[0];
}
