import Link from "next/link";
import { Card } from "@/components/ui";

export function EditorialCard({ title, text, children }) {
    return (<Card className="card-pad" variant="editorial">
      <h3 className="heading">{title}</h3>
      {text ? <p className="muted">{text}</p> : null}
      {children}
    </Card>);
}

export function ServiceCard({ title, text, href, image }) {
    return (<Card className="service-card" variant="service">
      <div className="service-media" style={{ backgroundImage: `url(${image})` }}/>
      <div className="card-pad">
        <h3>{title}</h3>
        <p className="muted">{text}</p>
        <Link className="btn secondary" href={href}>Explore</Link>
      </div>
    </Card>);
}

export function PackageCard({ title, price, items }) {
    return (<Card className="package card-pad" variant="package">
      <span className="tag">{price}</span>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </Card>);
}

export function PackageGrid({ items }) {
    return <div className="grid-3">{items.map((item) => <PackageCard key={item.title} {...item}/>)}</div>;
}

export function ImageGallery({ images }) {
    return <div className="grid-3">{images.map((image) => <div key={image} className="card gallery-img" style={{ backgroundImage: `url(${image})` }}/>)}</div>;
}

export const ImageGrid = ImageGallery;
