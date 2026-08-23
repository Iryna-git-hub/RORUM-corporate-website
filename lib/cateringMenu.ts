// Extracted from components/CateringMenuOverlay.jsx during the TS migration
// (it was ~400 lines of inline static data in the largest component file).

export interface CateringMenuItem {
  name: string;
  description: string;
  image: string;
  alt: string;
}

export interface CateringMenuCategory {
  id: string;
  title: string;
  navLabel: string;
  description: string;
  featuredItems: CateringMenuItem[];
  /**
   * Canonical `lucide-react` export name for this category's nav-tab icon,
   * as picked by an editor via the Studio icon picker (see
   * sanity/components/IconPickerInput.tsx / lib/iconCardIcons.ts). Not set
   * on the hardcoded fallback categories below — those keep resolving their
   * icon from CateringMenuOverlay.tsx's own `CATEGORY_ICONS` id-keyed map,
   * unchanged, so the emergency-fallback experience is pixel-identical to
   * before this field existed.
   */
  icon?: string;
}

export const menuCategories: CateringMenuCategory[] = [
  {
    id: "ukrainian",
    title: "Traditional Ukrainian cuisine",
    navLabel: "Ukrainian cuisine",
    description:
      "Authentic homemade dishes that bring warmth, generosity, and a true Ukrainian table experience to your event.",
    featuredItems: [
      {
        name: "Borscht",
        description:
          "Traditional Ukrainian beetroot soup with vegetables, herbs, and sour cream, served with dark bread.",
        image: "/images/catering/ukrainian-borscht-traditional.png",
        alt: "A bowl of traditional Ukrainian borscht with herbs",
      },
      {
        name: "Holubtsi",
        description:
          "Tender cabbage rolls filled with seasoned rice and meat and baked in sauce.",
        image: "/images/catering/catering-gallery-new-07.png",
        alt: "Holubtsi cabbage rolls arranged in a baking dish",
      },
      {
        name: "Varenyky",
        description:
          "Traditional Ukrainian dumplings with savory filling, served with sour cream, dill, and caramelized onions.",
        image: "/images/catering/ukrainian-varenyky.png",
        alt: "Ukrainian varenyky dumplings served on a plate",
      },
      {
        name: "Country-style potatoes",
        description:
          "Golden roasted potato wedges with herbs, dill, and dipping sauces. A simple, comforting Ukrainian-style side for shared tables.",
        image: "/images/catering/ukrainian-country-potatoes.png",
        alt: "Country-style roasted potatoes with dill and sauces",
      },
      {
        name: "Pork neck baked with garlic and herbs",
        description:
          "Tender roasted pork neck seasoned with garlic, rosemary, and herbs, served sliced as a warm, generous main dish.",
        image: "/images/catering/ukrainian-pork-neck.png",
        alt: "Baked pork neck sliced with garlic and herbs",
      },
      {
        name: "Vereshchaka",
        description:
          "A traditional Ukrainian pork dish slowly cooked in a rich, tangy sauce and often served with creamy potatoes.",
        image: "/images/catering/ukrainian-vereshchaka.png",
        alt: "Traditional Ukrainian vereshchaka with sauce and potatoes",
      },
      {
        name: "Chicken Kyiv",
        description:
          "A classic Ukrainian chicken cutlet filled with garlic-herb butter, breaded until crisp, and served golden on the outside with a melting center.",
        image: "/images/catering/ukrainian-chicken-kyiv.png",
        alt: "Chicken Kyiv cutlet with garlic herb butter filling",
      },
      {
        name: "Green borscht",
        description:
          "A fresh sorrel-based soup with potatoes, herbs, egg, and sour cream.",
        image: "/images/catering/ukrainian-green-borscht.png",
        alt: "Ukrainian green borscht with potatoes, egg, herbs, and sour cream",
      },
      {
        name: "Homemade sausage",
        description:
          "Traditional seasoned sausage prepared for a generous shared table.",
        image: "/images/catering/ukrainian-homemade-sausage.png",
        alt: "Homemade Ukrainian sausages served with mustard and pickles",
      },
      {
        name: "Deruny",
        description:
          "Crisp Ukrainian potato pancakes served warm with a creamy accompaniment.",
        image: "/images/catering/vegetarian-deruny-mushroom-sauce.png",
        alt: "Ukrainian deruny potato pancakes with mushroom sauce",
      },
      {
        name: "Pickles",
        description:
          "A bright selection of house-style pickled vegetables for the shared table.",
        image: "/images/catering/ukrainian-pickles.png",
        alt: "Assorted pickled vegetables served with dill",
      },
      {
        name: "Traditional salads",
        description:
          "A changing selection of familiar Ukrainian salads made for sharing.",
        image: "/images/catering/ukrainian-seasonal-salads.png",
        alt: "A seasonal selection of traditional Ukrainian salads",
      },
      {
        name: "Appetizers with salo",
        description:
          "Traditional salo served with bread, pickles, mustard, and savory accompaniments.",
        image: "/images/catering/catering-board.png",
        alt: "Salo appetizer board with bread and accompaniments",
      },
    ],
  },
  {
    id: "danish",
    title: "Danish cuisine",
    navLabel: "Danish cuisine",
    description:
      "Familiar Danish dishes and seasonal classics for relaxed, elegant, and locally inspired gatherings.",
    featuredItems: [
      {
        name: "Smørrebrød",
        description:
          "Traditional Danish open-faced sandwiches with seasonal toppings.",
        image: "/images/catering/danish-smorrebrod.png",
        alt: "Traditional Danish smorrebrod open-faced sandwiches",
      },
      {
        name: "Frikadeller",
        description:
          "Classic Danish meatballs, served warm with traditional sides.",
        image: "/images/catering/danish-frikadeller.png",
        alt: "Danish frikadeller served with potatoes, sauce, and pickles",
      },
      {
        name: "Marinated herring",
        description:
          "A Danish favorite, often served with bread, onions, and herbs.",
        image: "/images/catering/danish-marinated-herring.png",
        alt: "Marinated herring with onion, dill, capers, and rye bread",
      },
      {
        name: "Flæskesteg",
        description:
          "Roast pork with crispy crackling, served with classic Danish sides.",
        image: "/images/catering/danish-flaeskesteg.png",
        alt: "Flaeskesteg roast pork with crispy crackling and Danish sides",
      },
      {
        name: "Kalveculotte",
        description:
          "Tender roasted veal served sliced with seasonal accompaniments.",
        image: "/images/catering/danish-kalveculotte.png",
        alt: "Sliced kalveculotte served with roasted seasonal vegetables",
      },
      {
        name: "Danish baked potatoes",
        description:
          "Golden baked potatoes seasoned simply and served as a warm side.",
        image: "/images/catering/danish-baked-potatoes.png",
        alt: "Golden Danish baked potatoes with fresh herbs",
      },
      {
        name: "Flødekartofler",
        description:
          "Classic Danish potatoes baked in cream until tender and golden.",
        image: "/images/catering/danish-flodekartofler.png",
        alt: "Danish flødekartofler baked in cream until golden",
      },
      {
        name: "Danish seasonal appetizers",
        description:
          "Small seasonal starters selected to suit the occasion and time of year.",
        image: "/images/catering/danish-seasonal-appetizers.png",
        alt: "Assorted Danish seasonal appetizers on rye bread",
      },
      {
        name: "Traditional Danish dishes",
        description:
          "A rotating selection of familiar Danish classics for a shared table.",
        image: "/images/catering/danish-traditional-dishes.png",
        alt: "A platter of traditional Danish dishes and accompaniments",
      },
    ],
  },
  {
    id: "vegetarian",
    title: "Vegetarian menu",
    navLabel: "Vegetarian menu",
    description:
      "Seasonal vegetarian dishes with warm flavors, fresh ingredients, and thoughtful presentation.",
    featuredItems: [
      {
        name: "Baked pumpkin with feta and honey",
        description:
          "A warm seasonal dish with sweet, salty, and creamy notes.",
        image: "/images/catering/vegetarian-baked-pumpkin-feta-honey.png",
        alt: "Baked pumpkin with feta, honey and herbs",
      },
      {
        name: "Deruny with mushroom sauce",
        description:
          "Crispy potato pancakes served with a rich mushroom sauce.",
        image: "/images/catering/vegetarian-deruny-mushroom-sauce.png",
        alt: "Ukrainian deruny with creamy mushroom sauce",
      },
      {
        name: "Varenyky with potatoes and caramelized onions",
        description:
          "Traditional dumplings with a comforting vegetarian filling.",
        image: "/images/catering/vegetarian-varenyky-potatoes-onion.png",
        alt: "Varenyky with potatoes and caramelized onion",
      },
      {
        name: "Arugula salad with beetroot, feta and nuts",
        description:
          "Fresh, colorful, and balanced with earthy and creamy flavors.",
        image: "/images/catering/vegetarian-arugula-beetroot-feta-walnuts.png",
        alt: "Arugula salad with beetroot, feta and walnuts",
      },
      {
        name: "Hummus with seasonal vegetables",
        description: "Creamy hummus served with crisp seasonal vegetables.",
        image: "/images/catering/vegetarian-hummus-seasonal-vegetables.png",
        alt: "Hummus with seasonal vegetables",
      },
      {
        name: "Bruschetta with tomatoes and basil",
        description:
          "Toasted bread topped with ripe tomatoes, basil, and a light seasoning.",
        image: "/images/catering/vegetarian-bruschetta-tomatoes-basil.png",
        alt: "Bruschetta topped with tomatoes and basil",
      },
      {
        name: "Vegetable tartlets",
        description:
          "Small savory tartlets filled with colorful seasonal vegetables.",
        image: "/images/catering/vegetarian-vegetable-tartlets.png",
        alt: "Vegetable tartlets topped with colorful seasonal vegetables",
      },
    ],
  },
  {
    id: "finger-food",
    title: "Finger food",
    navLabel: "Finger food",
    description:
      "Elegant small bites for mingling, networking, receptions, and informal private gatherings.",
    featuredItems: [
      {
        name: "Mini appetizers with salmon and cream cheese",
        description:
          "Light, elegant bites suitable for receptions and welcome drinks.",
        image: "/images/catering/finger-food-salmon-cream-cheese.png",
        alt: "Mini appetizers with salmon and cream cheese",
      },
      {
        name: "Mini appetizers with avocado and shrimp",
        description: "Fresh and delicate finger food for a modern event table.",
        image: "/images/catering/finger-food-avocado-shrimp.png",
        alt: "Mini appetizers with avocado and shrimps",
      },
      {
        name: "Cheese platter",
        description:
          "Assorted cheeses served with nuts, honey, and seasonal additions.",
        image: "/images/catering/finger-food-cheese-platter.png",
        alt: "Cheese platter with assorted cheeses, nuts and honey",
      },
      {
        name: "Vegetable platter",
        description: "Fresh vegetables, pickles, and light seasonal snacks.",
        image: "/images/catering/finger-food-vegetable-platter.png",
        alt: "Vegetable platter with fresh vegetables and pickles",
      },
      {
        name: "Canapés",
        description:
          "Elegant bite-sized canapés with varied seasonal toppings.",
        image: "/images/catering/finger-food-canapes.png",
        alt: "Assorted canapés with salmon, roast meat, vegetables, and herbs",
      },
      {
        name: "Bruschetta",
        description:
          "Crisp toasted bread with fresh, savory toppings for easy sharing.",
        image: "/images/catering/finger-food-bruschetta.png",
        alt: "Bruschetta with tomato, basil, mushroom, and pesto toppings",
      },
      {
        name: "Mini burgers",
        description:
          "Small, satisfying burgers designed for receptions and informal gatherings.",
        image: "/images/catering/finger-food-mini-burgers.png",
        alt: "Mini burgers arranged on a serving platter",
      },
      {
        name: "Seasonal snacks",
        description:
          "A flexible assortment of small savory bites selected for the season.",
        image: "/images/catering/finger-food-seasonal-snacks.png",
        alt: "A varied selection of seasonal finger food and canapés",
      },
    ],
  },
  {
    id: "grill",
    title: "Grill menu",
    navLabel: "Grill menu",
    description:
      "A generous grill selection for relaxed celebrations, summer events, and warm informal gatherings.",
    featuredItems: [
      {
        name: "Shashlyk",
        description:
          "Grilled marinated meat, served hot with sides and sauces.",
        image: "/images/catering/grill-shashlyk.png",
        alt: "Shashlik with flatbread and pickled vegetables",
      },
      {
        name: "Grilled salmon",
        description:
          "Tender salmon prepared on the grill with seasonal accompaniments.",
        image: "/images/catering/grill-grilled-salmon.png",
        alt: "Grilled salmon with lemon and herbs",
      },
      {
        name: "Grilled vegetables",
        description: "Colorful seasonal vegetables with smoky grill flavor.",
        image: "/images/catering/grill-grilled-vegetables.png",
        alt: "Grilled vegetables with herbs",
      },
      {
        name: "Homemade sauces",
        description: "Sauces prepared in-house to complement the grill menu.",
        image: "/images/catering/grill-homemade-sauces.png",
        alt: "Homemade sauces in ceramic bowls",
      },
      {
        name: "Steaks",
        description:
          "Grilled cuts of meat cooked for a flavorful centerpiece to the menu.",
        image: "/images/catering/grill-steaks.png",
        alt: "Sliced grilled steaks served with peppers and onions",
      },
      {
        name: "Grilled sausages",
        description:
          "Seasoned sausages grilled until golden and served hot from the grill.",
        image: "/images/catering/grill-sausages.png",
        alt: "Grilled sausages served with mustard, pickles, and onions",
      },
      {
        name: "Seasonal sides",
        description:
          "Fresh seasonal vegetables and warm accompaniments for the grill menu.",
        image: "/images/catering/grill-seasonal-sides.png",
        alt: "Seasonal grilled vegetables, potatoes, and herbs",
      },
    ],
  },
  {
    id: "desserts",
    title: "Desserts and sweet table",
    navLabel: "Desserts and sweet table",
    description:
      "A festive dessert selection for celebrations, receptions, family events, and special occasions.",
    featuredItems: [
      {
        name: "Fruit sets",
        description:
          "Fresh seasonal fruit platters for receptions, brunches, and shared tables.",
        image: "/images/catering/desserts-fruit-sets.png",
        alt: "Fresh fruit sets with seasonal fruit",
      },
      {
        name: "Napoleon cake",
        description: "Layered pastry cake with creamy filling.",
        image: "/images/catering/desserts-napoleon-cake.png",
        alt: "Napoleon cake with layered pastry and cream",
      },
      {
        name: "Chocolate fountain",
        description:
          "A festive chocolate fountain served with fruit and sweet dipping snacks.",
        image: "/images/catering/desserts-chocolate-fountain.png",
        alt: "Chocolate fountain with fruit and sweets",
      },
      {
        name: "Ice cream with toppings",
        description: "Ice cream served with berries, chocolate, and toppings.",
        image: "/images/catering/desserts-ice-cream-toppings.png",
        alt: "Ice cream with berries, chocolate and toppings",
      },
      {
        name: "Medivnyk",
        description:
          "Traditional honey cake with soft layers and delicate cream.",
        image: "/images/catering/desserts-medivnyk.png",
        alt: "Medivnyk Ukrainian honey cake",
      },
      {
        name: "Traditional Ukrainian Pliatsky",
        description:
          "Rich, layered cakes made with delicate pastry, creamy fillings, fruit, nuts.",
        image: "/images/catering/desserts-pliatsky-green-apple.png",
        alt: 'Traditional Ukrainian "Green Apple" (Zelene Yabluko) pliatsok',
      },
      {
        name: "Festive sweets",
        description:
          "An assorted selection of small sweets for celebrations and dessert tables.",
        image: "/images/catering/desserts-festive-sweets.png",
        alt: "Assorted festive sweets, pastries, and miniature cakes",
      },
    ],
  },
];
