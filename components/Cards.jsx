import Link from "next/link";
import { Card } from "@/components/ui";
export function ServiceCard({ title, text, href, image }) {
    return (<Card className="service-card">
      <div className="service-media" style={{ backgroundImage: `url(${image})` }}/>
      <div className="card-pad">
        <h3>{title}</h3>
        <p className="muted">{text}</p>
        <Link className="btn secondary" href={href}>Explore</Link>
      </div>
    </Card>);
}
export function PackageCard({ title, price, items }) {
    return (<Card className="package card-pad">
      <span className="tag">{price}</span>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </Card>);
}
export function ImageGrid({ images }) {
    return <div className="grid-3">{images.map((image) => <div key={image} className="card gallery-img" style={{ backgroundImage: `url(${image})` }}/>)}</div>;
}
