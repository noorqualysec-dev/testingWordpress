import {
  formatPostDate,
  getFeaturedImage,
  getPostBySlug,
} from "@/lib/wordpress";
import Image from "next/image";

interface WordPressPostProps {
  slug: string;
}

export default async function WordPressPost({ slug }: WordPressPostProps) {
  const post = await getPostBySlug(slug);
  const featuredImage = getFeaturedImage(post);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="mb-4 text-sm font-medium text-teal-700">
        {formatPostDate(post.date)}
      </p>
      <h1
        className="text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl"
        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
      />
      {featuredImage?.source_url ? (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={featuredImage.source_url}
            alt={featuredImage.alt_text || ""}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}
      <article
        className="mt-8 space-y-6 text-lg leading-8 text-neutral-800 [&_a]:text-teal-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-semibold [&_li]:ml-6 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:my-5 [&_strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: post.content.rendered }}
      />
    </main>
  );
}
