import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";

interface WPYoastImage {
  url?: string;
  width?: number;
  height?: number;
  type?: string;
}

interface WPYoastHeadJson {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: {
    index?: string;
    follow?: string;
    "max-snippet"?: string;
    "max-image-preview"?: string;
    "max-video-preview"?: string;
  };
  og_locale?: string;
  og_type?: string;
  og_title?: string;
  og_description?: string;
  og_url?: string;
  og_site_name?: string;
  og_image?: WPYoastImage[];
  article_published_time?: string;
  article_modified_time?: string;
  author?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string | WPYoastImage[];
  schema?: unknown;
}

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  yoast_head_json?: WPYoastHeadJson;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
    }>;
  };
}

const WORDPRESS_API_BASE =
  "https://qualysec.com/wp-json/wp/v2";
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

export function getYoastStructuredData(post: WPPost) {
  const schema = post.yoast_head_json?.schema;

  if (!schema) {
    return undefined;
  }

  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function getYoastImages(images: WPYoastImage[] | undefined) {
  return images
    ?.filter((image) => image.url)
    .map((image) => ({
      url: image.url as string,
      width: image.width,
      height: image.height,
      type: image.type,
    }));
}

function getTwitterImage(image: WPYoastHeadJson["twitter_image"]) {
  if (typeof image === "string") {
    return image;
  }

  return getYoastImages(image)?.[0]?.url;
}

function getRobots(robots: WPYoastHeadJson["robots"]): Metadata["robots"] {
  if (!robots) {
    return undefined;
  }

  return {
    index: robots.index !== "noindex",
    follow: robots.follow !== "nofollow",
    googleBot: {
      index: robots.index !== "noindex",
      follow: robots.follow !== "nofollow",
      "max-snippet": robots["max-snippet"]
        ? Number(robots["max-snippet"])
        : undefined,
      "max-image-preview": robots["max-image-preview"] as
        | "none"
        | "standard"
        | "large"
        | undefined,
      "max-video-preview": robots["max-video-preview"]
        ? Number(robots["max-video-preview"])
        : undefined,
    },
  };
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

export const getPostBySlug = cache(async function getPostBySlug(slug: string) {
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
});

export async function getPostSeoMetadata(slug: string): Promise<Metadata> {
  const post = await getPostBySlug(slug);
  const yoast = post.yoast_head_json;
  const title = yoast?.title ?? stripHtml(post.title.rendered);
  const description =
    yoast?.description ?? stripHtml(post.excerpt.rendered ?? "");
  const ogImages = getYoastImages(yoast?.og_image);
  const twitterImage = getTwitterImage(yoast?.twitter_image);

  return {
    title,
    description,
    alternates: yoast?.canonical
      ? {
          canonical: yoast.canonical,
        }
      : undefined,
    authors: yoast?.author
      ? [
          {
            name: yoast.author,
          },
        ]
      : undefined,
    robots: getRobots(yoast?.robots),
    openGraph: {
      title: yoast?.og_title ?? title,
      description: yoast?.og_description ?? description,
      url: yoast?.og_url ?? yoast?.canonical,
      siteName: yoast?.og_site_name,
      locale: yoast?.og_locale,
      type: yoast?.og_type === "article" ? "article" : "website",
      publishedTime: yoast?.article_published_time,
      modifiedTime: yoast?.article_modified_time,
      authors: yoast?.author ? [yoast.author] : undefined,
      images: ogImages?.length ? ogImages : undefined,
    },
    twitter: {
      card:
        yoast?.twitter_card === "summary_large_image"
          ? "summary_large_image"
          : "summary",
      title: yoast?.twitter_title ?? yoast?.og_title ?? title,
      description:
        yoast?.twitter_description ?? yoast?.og_description ?? description,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}

//https://floralwhite-wombat-415522.hostingersite.com/wp-json/wp/v2