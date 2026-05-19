import WordPressPost from "../../components/WordPressPost";
import { getPostSeoMetadata } from "@/lib/wordpress";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;

  return getPostSeoMetadata(slug);
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;

  return <WordPressPost slug={slug} />;
}
