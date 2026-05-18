import WordPressPost from "../../components/WordPressPost";
import { getAllPostSlugs } from "@/lib/wordpress";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await getAllPostSlugs(100);

    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error(
      "SSG generation failed, falling back to dynamic rendering:",
      error,
    );
    return [];
  }
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;

  return <WordPressPost slug={slug} />;
}
