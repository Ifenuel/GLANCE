import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import insightLecture from "@/assets/chapter-lecture.jpg";
import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/site/page-header";
import { Container, Prose, Section } from "@/components/ui";
import { formatDate, postCategoryLabel } from "@/lib/format";
import { getPublishedPost } from "@/server/content";

type Params = { params: Promise<{ slug: string }> };

export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Story not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function NewsArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) notFound();

  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow={postCategoryLabel(post.category)}
        title={post.title}
        intro={
          <p className="text-[13.5px] text-navy-100/75">
            {formatDate(post.publishedAt)} · {post.authorName}
          </p>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-start">
            <article>
              <div className="relative aspect-16/9 overflow-hidden rounded-2xl ring-1 ring-line">
                <Image
                  src={post.coverImageUrl ?? insightLecture}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 800px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-8">
                <Prose>
                  <p className="text-[16px] text-navy-900">{post.excerpt}</p>
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </Prose>
              </div>
            </article>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-line bg-navy-50/40 p-6">
                <h2 className="text-[15px] font-extrabold text-navy-900">
                  Get involved
                </h2>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-500">
                  GLANCE grows through members and chapters. Apply to join, or
                  bring the movement to your institution.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <ButtonLink href="/join" size="sm">
                    Join GLANCE
                  </ButtonLink>
                  <ButtonLink href="/start-a-chapter" variant="outline" size="sm">
                    Start a Chapter
                  </ButtonLink>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="text-[15px] font-extrabold text-navy-900">
                  More stories
                </h2>
                <ButtonLink
                  href="/news"
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0"
                >
                  Back to all news
                </ButtonLink>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
