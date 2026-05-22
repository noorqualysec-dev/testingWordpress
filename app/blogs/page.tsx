import Image from "next/image";
import Link from "next/link";
import {
  formatPostDate,
  getFeaturedImage,
  getPostsPage,
} from "@/lib/wordpress";

export const metadata = {
  title: "Blog",
  description: "Latest articles from Qualysec.",
};

export const dynamic = "force-dynamic";

interface BlogPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

function getPageNumber(value: string | string[] | undefined) {
  const page = Array.isArray(value) ? value[0] : value;
  const pageNumber = Number(page ?? 1);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return 1;
  }

  return pageNumber;
}

function getPageHref(page: number) {
  return page === 1 ? "/blogs" : `/blogs?page=${page}`;
}

function BlogPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-6"
    >
      {hasPreviousPage ? (
        <Link
          href={getPageHref(currentPage - 1)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-teal-700 hover:text-teal-700"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-400">
          Previous
        </span>
      )}

      <span className="text-sm font-medium text-neutral-600">
        {currentPage} / {totalPages}
      </span>

      {hasNextPage ? (
        <Link
          href={getPageHref(currentPage + 1)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-teal-700 hover:text-teal-700"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-400">
          Next
        </span>
      )}
    </nav>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const currentPage = getPageNumber((await searchParams).page);
  const { posts, totalPages, totalPosts } = await getPostsPage(currentPage, 9);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-normal text-teal-700">
            Blog
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
            Latest Articles
          </h1>
        </div>
        <p className="text-sm font-medium text-neutral-600">
          Page {currentPage} of {totalPages} &middot; {totalPosts} posts
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const featuredImage = getFeaturedImage(post);

          return (
            <Link
              key={post.id}
              href={`/${post.slug}`}
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
                    loading="eager"
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

      <BlogPagination currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
}
