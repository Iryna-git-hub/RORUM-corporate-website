import Image from "next/image";
import { ArrowRight, DoorOpen, HeartHandshake, Sprout } from "lucide-react";
import { CvUploadButton } from "@/components/CvUploadModal";
import { Container, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/work-with-us");

const featureItems = [
  {
    text: "Opportunities grow through people",
    icon: Sprout,
  },
  {
    text: "The right environment opens new doors",
    icon: DoorOpen,
  },
  {
    text: "Let’s create something meaningful together",
    icon: HeartHandshake,
  },
];

const HERO_TEXT_P_CLASS = "m-0 max-w-[66ch] text-text-primary text-base leading-[1.7]";

export default function WorkWithUsPage() {
  return (
    <>
      <section className="bg-white pt-[65px] pb-[clamp(38px,6vw,78px)] max-tablet:pt-[38px] max-tablet:pb-12">
        <Container>
          <div className="grid grid-cols-[minmax(0,1.02fr)_minmax(320px,0.88fr)] gap-[clamp(32px,5vw,72px)] items-center max-desktop:grid-cols-1">
            <div className="grid gap-[clamp(14px,2vw,22px)] max-w-[720px] max-desktop:max-w-[760px]">
              <SectionLabel>Work with us</SectionLabel>
              <h1 className="font-heading font-medium text-text-primary m-0 max-w-[11ch] text-[3rem] leading-[1.2] tracking-[0] max-tablet:text-[clamp(2rem,10vw,3rem)]">
                Work with us
              </h1>
              <div className="grid gap-3.5">
                <p className={HERO_TEXT_P_CLASS}>
                  If our work resonates with you, we would be happy to get to know you.
                </p>
                <p className={HERO_TEXT_P_CLASS}>
                  Please feel free to send us your CV, and if any opportunities arise within our projects or activities that match your experience and interests, we will be sure to get in touch.
                </p>
                <p className={HERO_TEXT_P_CLASS}>
                  We believe that opportunities grow through people — and
                  sometimes the right environment can open doors you didn’t even
                  know existed.
                </p>

                <p className={HERO_TEXT_P_CLASS}>
                  Maybe it leads to a collaboration.
                  <br />
                  Maybe to a role.
                  <br />
                  Or maybe to a connection that brings something unexpected.
                </p>
                <p className={HERO_TEXT_P_CLASS}>Either way — it starts here.</p>
              </div>
              <CvUploadButton className="group inline-flex items-center justify-center gap-2 min-h-[46px] w-fit px-[clamp(20px,3vw,30px)] border border-primary rounded-pill bg-primary text-white text-[12.5px] font-bold tracking-[0.02em] uppercase cursor-pointer transition-[transform,background-color,border-color,color] duration-[180ms] ease-[ease] hover:-translate-y-px hover:bg-primary-dark hover:border-primary-dark hover:text-white active:bg-primary-darker active:border-primary-darker max-tablet:w-full">
                <span>Send your CV</span>
                <ArrowRight
                  className="w-[15px] h-[15px] shrink-0 transition-transform duration-[180ms] ease-[ease] group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
              </CvUploadButton>
            </div>
            <div className="relative w-full aspect-square min-h-0 overflow-visible isolate max-tablet:max-w-full">
              <div className="absolute overflow-hidden bg-beige shadow-[0_18px_42px_rgba(var(--rgb-brown),0.1)] top-0 right-0 w-[66.666%] aspect-square">
                <Image
                  className="object-cover object-center"
                  src="/images/work-with-us/kitchen-collaboration.png"
                  alt="RORUM collaborators cooking together in the kitchen"
                  fill
                  priority
                  sizes="(max-width: 980px) 100vw, 50vw"
                />
              </div>
              <div className="absolute overflow-hidden bg-beige shadow-[0_18px_42px_rgba(var(--rgb-brown),0.1)] left-0 bottom-0 z-2 w-1/2 aspect-square max-tablet:w-[55%]">
                <Image
                  className="object-cover object-[center_56%]"
                  src="/images/work-with-us/light-collaboration.png"
                  alt="Light RORUM collaboration scene with planning materials"
                  fill
                  sizes="(max-width: 640px) 34vw, 14vw"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-[clamp(40px,6vw,76px)] bg-cream">
        <Container>
          <div className="grid grid-cols-3 gap-[clamp(14px,2vw,22px)] max-desktop:grid-cols-2 max-tablet:grid-cols-1">
            {featureItems.map(({ text, icon: Icon }) => (
              <article
                className="flex items-start gap-5 min-h-0 py-[clamp(16px,2.4vw,24px)]"
                key={text}
              >
                <Icon
                  className="w-9 h-9 flex-none text-red"
                  aria-hidden="true"
                  strokeWidth={1.7}
                />
                <p className="m-0 text-text-primary text-[clamp(15px,1.1vw,17px)] leading-[1.35] font-extrabold max-w-[18ch]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

    </>
  );
}
