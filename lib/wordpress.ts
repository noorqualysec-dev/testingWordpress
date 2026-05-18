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

const WORDPRESS_API_BASE =
  "https://floralwhite-wombat-415522.hostingersite.com/wp-json/wp/v2";
const WORDPRESS_FALLBACK_API_BASE = "https://qualysec.com/wp-json/wp/v2";
const REVALIDATE_SECONDS = 60;
const DEFAULT_POSTS_PER_PAGE = 10;

type ConfigureWordPressUrl = (url: URL) => void;

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

async function fetchWordPress(
  path: string,
  configureUrl: ConfigureWordPressUrl,
) {
  const fetchFrom = async (baseUrl: string) => {
    const url = new URL(`${baseUrl}${path}`);
    configureUrl(url);

    return fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  };

  try {
    return await fetchFrom(WORDPRESS_API_BASE);
  } catch (error) {
    console.error("Primary WordPress endpoint failed, using fallback:", error);
    return fetchFrom(WORDPRESS_FALLBACK_API_BASE);
  }
}

export async function getLatestPosts(count = DEFAULT_POSTS_PER_PAGE) {
  const res = await fetchWordPress("/posts", (url) => {
    url.searchParams.set("per_page", String(count));
    url.searchParams.set("orderby", "date");
    url.searchParams.set("order", "desc");
    url.searchParams.set("_embed", "1");
  });

  if (!res.ok) {
    throw new Error("Failed to load WordPress posts");
  }

  return (await res.json()) as WPPost[];
}

export async function getPostsPage(
  page = 1,
  perPage = DEFAULT_POSTS_PER_PAGE,
) {
  const res = await fetchWordPress("/posts", (url) => {
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("orderby", "date");
    url.searchParams.set("order", "desc");
    url.searchParams.set("_embed", "1");
  });

  if (res.status === 400) {
    notFound();
  }

  if (!res.ok) {
    throw new Error("Failed to load WordPress posts");
  }

  return {
    posts: (await res.json()) as WPPost[],
    totalPosts: Number(res.headers.get("x-wp-total") ?? 0),
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
  };
}

export async function getAllPostSlugs(count = 100) {
  const res = await fetchWordPress("/posts", (url) => {
    url.searchParams.set("per_page", String(count));
    url.searchParams.set("_fields", "slug");
  });

  if (!res.ok) {
    throw new Error("Failed to fetch post slugs for SSG generation");
  }

  const posts = (await res.json()) as { slug: string }[];
  return posts;
}

export async function getPostBySlug(slug: string) {
  const res = await fetchWordPress("/posts", (url) => {
    url.searchParams.set("slug", slug);
    url.searchParams.set("_embed", "1");
  });

  if (!res.ok) {
    notFound();
  }

  const posts = (await res.json()) as WPPost[];

  if (!posts.length) {
    notFound();
  }

  return posts[0];
}
