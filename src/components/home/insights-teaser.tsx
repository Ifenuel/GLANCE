import Image from "next/image";
import Link from "next/link";
import chapterAudience from "@/assets/chapter-audience.jpg";
import chapterCheer from "@/assets/chapter-cheer.jpg";
import chapterLecture from "@/assets/chapter-lecture.jpg";
import { ButtonLink } from "@/components/button-link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/site/reveal";
import { TiltCard } from "@/components/site/tilt-card";
import { Container, EmptyState, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listPublishedPosts } from "@/server/content";

const covers = [chapterAudience, chapterLecture, chapterCheer];

export async function InsightsTeaser() {
  const posts = await listPublishedPosts(3);

  return (
    <section id="insights" className="bg-navy-50/50 py-16 lg:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,2fr)] lg:items-start">
          <Reveal>
            <SectionHeading
              eyebrow="News & Updates"
              title="Latest News"
              accent="& Updates"
              intro={
                <p>
                  Updates published by GLANCE and the GLANCE chapters: sessions,
                  roundtables, campus activations and member stories.
                </p>
              }
            />
            <ButtonLink href="/news" variant="gold" size="sm" className="mt-7">
              View All News
            </ButtonLink>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState
                  title="No stories published yet"
                  description="Chapters and the GLANCE team publish news, events and impact stories on the member platform. They appear here as soon as they are published."
                  action={
                    <ButtonLink href="/events" variant="outline" size="sm">
                      See upcoming events
                    </ButtonLink>
                  }
                />
              </div>
            ) : (
              posts.map((post, index) => (
                <Reveal key={post.id} delay={index * 80}>
                  <TiltCard className="group h-full">
                    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white">
                      <div className="relative h-[150px] w-full overflow-hidden">
                        <Image
                          src={post.coverImageUrl ?? covers[index % covers.length]}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 300px, 100vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-gold-400 to-gold-300 transition-transform duration-500 group-hover:scale-x-100"
                        />
                      </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-[15.5px] leading-[1.45] font-bold text-navy-900">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-[13px] leading-[1.75] text-ink-500">
                        {post.excerpt}
                      </p>
                      <p className="mt-auto pt-4 text-[12px] text-ink-500">
                        {formatDate(post.publishedAt)}
                      </p>
                      <Link
                        href={`/news/${post.slug}`}
                        className="mt-2 inline-flex w-fit items-center gap-2 text-[13px] font-bold text-navy-900 transition-all hover:text-navy-500 group-hover:gap-3"
                      >
                        Read story
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                    </article>
                  </TiltCard>
                </Reveal>
              ))
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
