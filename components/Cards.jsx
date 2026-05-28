import Link from "next/link";
import { Card } from "@/components/ui";
import { CircleCheckBig } from "lucide-react";

export function EditorialCard({ title, text, children }) {
    return (<Card className="card-pad" variant="editorial">
      <h3 className="heading">{title}</h3>
      {text ? <p>{text}</p> : null}
      {children}
    </Card>);
}

export function ServiceCard({ title, text, href, image }) {
    return (<Card className="service-card" variant="service">
      <div className="service-media" style={{ backgroundImage: `url(${image})` }}/>
      <div className="card-pad">
        <h3>{title}</h3>
        <p>{text}</p>
        <Link className="btn secondary" href={href}>Explore</Link>
      </div>
    </Card>);
}

export function PackageCard({ title, price, items }) {
    const priceMatch = typeof price === "string" ? price.match(/^Price:\s*(.+?)\s+ex VAT$/i) : null;
    const amountMatch = priceMatch ? priceMatch[1].match(/^(.+?)\s+([A-Z]{3})$/) : null;
    return (<Card className="package card-pad" variant="package">
      <span className="tag">
        {priceMatch ? (<>
          <span className="package-price-label">Price:</span>
          <span className="package-price-main">
            {amountMatch ? <><span>{amountMatch[1]}</span> <small>{amountMatch[2]}</small></> : priceMatch[1]}
          </span>
          <span className="package-price-vat">ex VAT</span>
        </>) : price}
      </span>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}><CircleCheckBig aria-hidden="true" strokeWidth={1.9}/><span>{item}</span></li>)}</ul>
    </Card>);
}

export function PackageGrid({ items }) {
    return <div className="grid-3">{items.map((item) => <PackageCard key={item.title} {...item}/>)}</div>;
}

export function ImageGallery({ images }) {
    return <div className="grid-3">{images.map((image) => <div key={image} className="card gallery-img" style={{ backgroundImage: `url(${image})` }}/>)}</div>;
}

export const ImageGrid = ImageGallery;
