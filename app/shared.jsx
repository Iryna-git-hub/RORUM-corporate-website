import Link from "next/link";
import { Card } from "@/components/ui";
export function CardsGrid({ items }) {
    return (<div className="grid-4">
      {items.map(([title, text, href]) => (<Card key={title} className="card-pad">
          <h3 className="heading" style={{ fontSize: "clamp(28px, 3vw, 48px)", margin: 0 }}>{title}</h3>
          <p className="muted">{text}</p>
          <Link className="btn secondary" href={href}>Open</Link>
        </Card>))}
    </div>);
}
