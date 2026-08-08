import Image from "next/image";
import { ArrowRight, HandHeart, Rocket, Users } from "lucide-react";
import { Container, SectionLabel } from "@/components/ui";
import { VolunteerApplicationButton } from "@/components/VolunteerApplicationForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/volunteer");

const highlightStatements = [
  { text: "A place where people know each other.", icon: Users },
  { text: "Support each other.", icon: HandHeart },
  { text: "Build something together.", icon: Rocket },
];

export default function VolunteerPage() {
  return (
    <div>
      <section className="bg-cream px-0 pt-16.25 pb-[clamp(46px,7vw,92px)] max-sm:pt-9.5 max-sm:pb-12">
        <Container>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)] gap-[clamp(34px,5vw,74px)] items-center max-lg:grid-cols-1">
            <div className="grid gap-[clamp(14px,2vw,22px)] max-w-[720px] max-lg:max-w-[760px]">
              <SectionLabel>Volunteer with us</SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 max-w-none text-[3rem] leading-[1.2] tracking-normal max-sm:text-[clamp(2rem,10vw,3rem)]">
                Volunteer at RORUM
              </h1>
              <div className="grid gap-3.5">
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  It often starts with something simple — a conversation, a
                  shared idea, a moment that brings people together.
                </p>
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  At RORUM, these moments turn into experiences.
                  <br />
                  And experiences turn into community.
                </p>
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  Volunteering here is more than helping at events.
                  <br />
                  It’s becoming part of a space where people create, connect,
                  and grow side by side.
                </p>
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  You might be welcoming guests, supporting a workshop, or
                  simply helping shape the atmosphere — but along the way, you
                  become part of something real.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-[clamp(16px,2.4vw,38px)] mt-[clamp(4px,1vw,10px)] p-[clamp(16px,2.4vw,24px)] border border-red max-sm:grid-cols-1">
                {highlightStatements.map(({ text, icon: Icon }) => (
                  <div
                    className="grid justify-items-center content-start gap-3.5 py-3 text-center"
                    key={text}
                  >
                    <Icon
                      className="w-9 h-9 text-red"
                      aria-hidden="true"
                      strokeWidth={1.7}
                    />
                    <p className="m-0 text-text-primary text-[14px] leading-[1.4] font-bold">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3.5 pt-[clamp(8px,1.5vw,16px)]">
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  In return, you gain experience, meet inspiring people, and
                  become part of an international creative community in the
                  heart of Copenhagen.
                </p>
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  If you feel a spark reading this — it probably means you
                  belong here.
                </p>
                <p className="m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]">
                  Apply to volunteer and join RORUM.
                </p>
              </div>
              <VolunteerApplicationButton className="btn group min-h-[46px]! px-[clamp(20px,3vw,30px)]! max-sm:w-full!">
                <span>Apply to volunteer</span>
                <ArrowRight
                  className="button-arrow w-3.75 h-3.75 shrink-0 transition-transform duration-180 ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </VolunteerApplicationButton>
            </div>
            <div className="relative min-h-[clamp(520px,56vw,720px)] overflow-hidden bg-beige lg:sticky lg:top-24 lg:self-start max-lg:min-h-[clamp(300px,48vw,440px)] max-sm:min-h-[280px]">
              <Image
                src="/images/events/volunteer-with-us.png"
                alt="RORUM volunteers welcoming guests and preparing a gathering"
                fill
                priority
                sizes="(max-width: 980px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
