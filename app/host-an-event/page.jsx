import Link from "next/link";
import { ArrowRight, CalendarCheck, CircleCheckBig, Coffee, HandHeart, SlidersHorizontal, Users, Wine } from "lucide-react";
import { HostEventInquiryForm } from "@/components/HostEventInquiryForm";
import { Button, Container, Section, SectionHeader, SectionLabel } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/host-an-event");

const quickFacts = [
  { label: "4–15 guests", icon: Users },
  { label: "Flexible setup", icon: SlidersHorizontal },
  { label: "On-site support", icon: HandHeart },
  { label: "Catering and decoration optional", icon: Wine }
];

const eventPackages = [
  {
    title: "Single Session",
    price: "700 DKK ex VAT",
    description: "A compact hosted format for one workshop, class or community session.",
    meta: "Up to 2 hours",
    items: ["Space setup", "Wi-Fi", "Tea & water", "Light on-site support"]
  },
  {
    title: "Evening Series",
    price: "1250 DKK ex VAT / 4 sessions",
    secondPrice: "2000 DKK ex VAT / 8 sessions",
    description: "A recurring slot for formats that need rhythm and consistency.",
    meta: "Weekly sessions",
    items: ["Reserved weekly time slot", "Consistent setup", "Tea & water", "Storage option by agreement"]
  },
  {
    title: "Weekend Event",
    price: "1200 DKK ex VAT",
    description: "A longer format for deeper workshops, gatherings or facilitated sessions.",
    meta: "Up to 4 hours",
    items: ["Space setup", "Flexible setup", "Tea & water", "On-site support"]
  }
];

const addOns = [
  { title: "Catering", text: "Thoughtful food and drinks for your gathering.", href: "/catering", icon: Coffee },
  { title: "Event Decoration", text: "Styling and atmosphere details.", href: "/event-decoration", icon: Wine }
];

const steps = [
  ["Tell us your idea", "Share your format, date and group size."],
  ["We suggest the setup", "We help choose the right package and add-ons."],
  ["Host your event", "RORUM prepares the space and supports the event flow."]
];

function PackagePrice({ children, secondary = false }) {
  const [amount, rest = ""] = children.split("ex VAT");
  const className = secondary ? "host-package-price host-package-price-secondary" : "host-package-price";

  return (
    <p className={className}>
      <span>{amount.trim()}</span>
      <span className="host-package-tax">ex VAT</span>
      {rest ? <span className="host-package-tax">{rest.trim()}</span> : null}
    </p>
  );
}

export default function HostPage() {
  return (
    <>
      <section className="host-page-hero">
        <div className="host-page-hero-media" aria-hidden="true"/>
        <div className="host-page-hero-overlay"/>
        <Container>
          <div className="host-page-hero-copy">
            <SectionLabel>HOST AT RORUM</SectionLabel>
            <h1 className="heading">Host your event at RORUM</h1>
            <p>Create a workshop, talk, wellness session, creative class or community gathering in a warm Copenhagen space with support from the RORUM team.</p>
            <div className="host-hero-actions">
              <Button href="#event-inquiry">Send Event Inquiry</Button>
              <Button href="#packages" variant="secondary">See Packages</Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="host-quick-facts" aria-label="Quick facts">
        <Container>
          <div className="host-quick-facts-grid">
            {quickFacts.map(({ label, icon: Icon }) => (
              <div className="host-fact" key={label}>
                <Icon aria-hidden="true" strokeWidth={1.9}/>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <div id="packages" className="host-section-anchor">
            <SectionHeader label="Packages" title="Choose your event package" text="Simple packages for one-time workshops, recurring sessions and deeper weekend gathering."/>
          </div>
          <div className="host-package-grid">
            {eventPackages.map((item) => (
              <article className="host-package-card" key={item.title}>
                <div className="host-package-main">
                  <h3>{item.title}</h3>
                  <PackagePrice>{item.price}</PackagePrice>
                  {item.secondPrice ? <PackagePrice secondary>{item.secondPrice}</PackagePrice> : null}
                  {item.meta ? <p className="host-package-meta">{item.meta}</p> : null}
                  <Link className="btn host-package-cta" href="#event-inquiry">
                    <span>Select package</span>
                    <ArrowRight aria-hidden="true" strokeWidth={1.9}/>
                  </Link>
                  <p className="host-package-description">{item.description}</p>
                </div>
                <div className="host-package-included">
                  <p className="host-package-included-title">What included</p>
                  <ul>
                    {item.items.map((feature) => (
                      <li key={feature}>
                        <CircleCheckBig aria-hidden="true" strokeWidth={1.9}/>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <p className="host-package-note">
            <span>
              Not sure which format fits?{" "}
              <Link href="/contact">
                <span>Tell us</span>
              </Link>{" "}
              your idea and we&apos;ll guide you.
            </span>
          </p>
        </Container>
      </Section>

      <section className="host-addons-section">
        <Container>
          <div className="host-addon-grid">
            {addOns.map(({ title, text, href, icon: Icon }) => (
              <Link className="host-addon-card" href={href} key={title}>
                <Icon aria-hidden="true" strokeWidth={1.8}/>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <ArrowRight aria-hidden="true" strokeWidth={1.9}/>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Section tight>
        <Container>
          <SectionHeader label="How it works" title="A simple supported flow"/>
          <div className="host-steps">
            {steps.map(([title, text], index) => (
              <article className="host-step" key={title}>
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <section className="section form-section">
        <Container>
          <div id="event-inquiry" className="host-form-wrap">
            <div className="host-form-aside">
              <SectionLabel>Event request</SectionLabel>
              <h2 className="heading section-title">Ready to shape your event?</h2>
              <p>Share your preferred package, date, group size and optional details. The RORUM team will suggest the clearest setup for your gathering.</p>
              <div className="host-form-aside-note">
                <CalendarCheck aria-hidden="true" strokeWidth={1.8}/>
                <span>One clear inquiry is enough to start the conversation.</span>
              </div>
              <div className="host-form-aside-note">
                <Coffee aria-hidden="true" strokeWidth={1.8}/>
                <span>Add food, coffee or styling only if it supports the experience.</span>
              </div>
            </div>
            <HostEventInquiryForm/>
          </div>
        </Container>
      </section>
    </>
  );
}
