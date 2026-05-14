import Image from "next/image";
import Link from "next/link";
import {
  formatPostDate,
  getFeaturedImage,
  getLatestPosts,
} from "@/lib/wordpress";

export const metadata = {
  title: "Blog",
  description: "Latest articles from Qualysec.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getLatestPosts(10);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-normal text-teal-700">
          Blog
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
          Latest Articles
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const featuredImage = getFeaturedImage(post);

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:-translate-y-1 hover:border-teal-600 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] bg-neutral-100">
                {featuredImage?.source_url ? (
                  <Image
                    src={featuredImage.source_url}
                    alt={featuredImage.alt_text || ""}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="p-5">
                <p className="text-sm font-medium text-teal-700">
                  {formatPostDate(post.date)}
                </p>
                <h2
                  className="mt-3 text-xl font-semibold leading-7 text-neutral-950 group-hover:text-teal-700"
                  dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                />
                <div
                  className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
