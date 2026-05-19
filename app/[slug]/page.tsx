import WordPressPost from "../components/WordPressPost";
import { getPostSeoMetadata } from "@/lib/wordpress";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;

  return getPostSeoMetadata(slug);
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  return <WordPressPost slug={slug} />;
}
