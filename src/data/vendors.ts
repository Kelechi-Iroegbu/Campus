export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: number;
};

export type Vendor = {
  key: string;
  /** "product" (default) shows a menu + cart; "service" shows bookable services. */
  kind?: "product" | "service";
  name: string;
  /** Dish-style blurb shown on the Home feed card, e.g. "Jollof Rice • Chicken". */
  subtitle: string;
  /** Cuisine-style label shown on the vendor detail screen, e.g. "Nigerian Meals". */
  category: string;
  rating: string;
  reviewCount: number;
  time: string;
  distance: string;
  status: "Open" | "Popular";
  closesAt: string;
  /** Card thumbnail on Home. */
  image: number;
  /** Wide hero banner on the vendor detail screen — falls back to `image`. */
  heroImage?: number;
  /** Small avatar next to the vendor name on the detail screen — falls back to `image`. */
  avatarImage?: number;
  about: string;
  menuCategories: string[];
  menu: MenuItem[];
  /** Sticky cart bar preview (UI-only mock, not real cart state). Falls back
   * to a computed sum of the first 3 menu items if not set. */
  cartPreview?: { count: number; total: number };
};

const jollofChicken = require("@/assets/images/vendor/food-jollof-chicken.png");
const efoRiro = require("@/assets/images/vendor/food-efo-riro.png");
const friedRice = require("@/assets/images/vendor/food-fried-rice.png");
const puffPuff = require("@/assets/images/vendor/food-puff-puff.png");
const moiMoi = require("@/assets/images/vendor/food-moi-moi.png");
const mamaT = require("@/assets/images/home/vendor-mama-t.png");
const mamaTHero = require("@/assets/images/vendor/mama-t-hero.png");
const mamaTAvatar = require("@/assets/images/vendor/mama-t-avatar.png");
const bakesFola = require("@/assets/images/home/vendor-bakes-fola.png");
const zeeDrinks = require("@/assets/images/home/vendor-zee-drinks.png");
const campusBites = require("@/assets/images/home/vendor-campus-bites.png");
const beauty = require("@/assets/images/home/cat-beauty.png");

export const vendors: Vendor[] = [
  {
    key: "mama-t",
    name: "Mama T's Kitchen",
    subtitle: "Jollof Rice • Chicken",
    category: "Nigerian Meals",
    rating: "4.8",
    reviewCount: 230,
    time: "15–30 mins",
    distance: "0.4 km",
    status: "Open",
    closesAt: "10 PM",
    image: mamaT,
    heroImage: mamaTHero,
    avatarImage: mamaTAvatar,
    about: "Home style meals made fresh daily with love ❤️",
    menuCategories: ["All", "Main Meals", "Sides", "Drinks", "Combos"],
    cartPreview: { count: 3, total: 6300 },
    menu: [
      {
        id: "jollof-chicken",
        name: "Jollof Rice & Chicken",
        description: "Delicious party jollof rice served with grilled chicken",
        price: 2500,
        image: jollofChicken,
      },
      {
        id: "efo-riro",
        name: "Efo Riro with Assorted Meat",
        description: "Flavorful spinach stew with assorted meat",
        price: 2800,
        image: efoRiro,
      },
      {
        id: "fried-rice",
        name: "Fried Rice",
        description: "Tasty fried rice with mixed vegetables",
        price: 2200,
        image: friedRice,
      },
      {
        id: "puff-puff",
        name: "Puff Puff (10 pcs)",
        description: "Soft and fluffy puff puff",
        price: 800,
        image: puffPuff,
      },
      {
        id: "moi-moi",
        name: "Moi Moi (2 pcs)",
        description: "Steamed bean pudding wrapped in leaves",
        price: 600,
        image: moiMoi,
      },
    ],
  },
  {
    key: "beauty-bar",
    kind: "service",
    name: "Mama Ngozi's Beauty Bar",
    subtitle: "Nails • Lashes • Braids",
    category: "Beauty & Grooming",
    rating: "4.9",
    reviewCount: 86,
    time: "By appointment",
    distance: "0.6 km",
    status: "Open",
    closesAt: "6 PM",
    image: beauty,
    heroImage: beauty,
    avatarImage: beauty,
    about:
      "Nails, lashes and braids by appointment. Book a time that works for you — walk-ins depend on the day.",
    menuCategories: [],
    menu: [],
  },
  {
    key: "bakes-fola",
    name: "Bakes by Fola",
    subtitle: "Pastries & Cakes",
    category: "Bakery",
    rating: "4.7",
    reviewCount: 164,
    time: "20–30 min",
    distance: "0.6 km",
    status: "Open",
    closesAt: "8 PM",
    image: bakesFola,
    about: "Freshly baked pastries and cakes made every morning.",
    menuCategories: ["All", "Cakes", "Pastries", "Drinks"],
    menu: [
      {
        id: "puff-puff-bf",
        name: "Puff Puff (10 pcs)",
        description: "Soft and fluffy puff puff, lightly sweetened",
        price: 800,
        image: puffPuff,
      },
      {
        id: "meat-pie",
        name: "Meat Pie (2 pcs)",
        description: "Flaky pastry filled with seasoned minced meat",
        price: 900,
        image: bakesFola,
      },
      {
        id: "cupcake",
        name: "Vanilla Cupcake (4 pcs)",
        description: "Soft vanilla cupcakes with buttercream icing",
        price: 1500,
        image: bakesFola,
      },
      {
        id: "chin-chin",
        name: "Chin Chin (Small Pack)",
        description: "Crunchy sweet fried pastry snack",
        price: 700,
        image: bakesFola,
      },
    ],
  },
  {
    key: "zee-drinks",
    name: "Zee Drinks",
    subtitle: "Smoothies & Juices",
    category: "Juice Bar",
    rating: "4.6",
    reviewCount: 98,
    time: "10–15 min",
    distance: "0.2 km",
    status: "Popular",
    closesAt: "9 PM",
    image: zeeDrinks,
    about: "Fresh fruit smoothies and juices, blended to order.",
    menuCategories: ["All", "Smoothies", "Juices", "Shakes"],
    menu: [
      {
        id: "mango-smoothie",
        name: "Mango Smoothie",
        description: "Fresh mango blended with yogurt and honey",
        price: 1800,
        image: zeeDrinks,
      },
      {
        id: "orange-juice",
        name: "Fresh Orange Juice",
        description: "Freshly squeezed orange juice, no added sugar",
        price: 1200,
        image: zeeDrinks,
      },
      {
        id: "watermelon-juice",
        name: "Watermelon Juice",
        description: "Chilled fresh watermelon juice",
        price: 1200,
        image: zeeDrinks,
      },
      {
        id: "pineapple-shake",
        name: "Pineapple Shake",
        description: "Creamy pineapple milkshake",
        price: 1900,
        image: zeeDrinks,
      },
    ],
  },
  {
    key: "campus-bites",
    name: "Campus Bites",
    subtitle: "Fried Rice • Beef",
    category: "Rice & Grills",
    rating: "4.9",
    reviewCount: 312,
    time: "15–20 min",
    distance: "0.5 km",
    status: "Open",
    closesAt: "11 PM",
    image: campusBites,
    about: "Generous rice bowls and grilled favorites for campus appetites.",
    menuCategories: ["All", "Rice", "Sides", "Grills"],
    menu: [
      {
        id: "fried-rice-beef",
        name: "Fried Rice & Beef",
        description: "Fried rice served with grilled beef strips",
        price: 2700,
        image: friedRice,
      },
      {
        id: "jollof-cb",
        name: "Jollof Rice",
        description: "Smoky party-style jollof rice",
        price: 2300,
        image: jollofChicken,
      },
      {
        id: "beef-suya",
        name: "Beef Suya",
        description: "Spicy grilled beef skewers with suya spice",
        price: 2000,
        image: campusBites,
      },
      {
        id: "coleslaw",
        name: "Coleslaw",
        description: "Fresh cabbage and carrot coleslaw",
        price: 700,
        image: campusBites,
      },
    ],
  },
  {
    key: "grill-house",
    name: "Grill House",
    subtitle: "Suya • Grilled Chicken",
    category: "Grills & Suya",
    rating: "4.7",
    reviewCount: 141,
    time: "20–25 min",
    distance: "0.7 km",
    status: "Open",
    closesAt: "10 PM",
    image: mamaT,
    about: "Charcoal-grilled meats and suya, prepared fresh to order.",
    menuCategories: ["All", "Grills", "Sides"],
    menu: [
      {
        id: "grilled-chicken",
        name: "Grilled Chicken (Half)",
        description: "Smoky charcoal-grilled chicken with pepper sauce",
        price: 3200,
        image: jollofChicken,
      },
      {
        id: "beef-suya-gh",
        name: "Beef Suya",
        description: "Spicy grilled beef skewers",
        price: 2000,
        image: mamaT,
      },
      {
        id: "grilled-plantain",
        name: "Grilled Plantain",
        description: "Sweet grilled plantain, lightly spiced",
        price: 900,
        image: efoRiro,
      },
    ],
  },
  {
    key: "sweet-treats",
    name: "Sweet Treats",
    subtitle: "Cupcakes • Cookies",
    category: "Cupcakes & Cookies",
    rating: "4.8",
    reviewCount: 176,
    time: "15–25 min",
    distance: "0.3 km",
    status: "Popular",
    closesAt: "8 PM",
    image: bakesFola,
    about: "Handmade cupcakes and cookies baked fresh every day.",
    menuCategories: ["All", "Cupcakes", "Cookies"],
    menu: [
      {
        id: "cupcake-st",
        name: "Chocolate Cupcake (4 pcs)",
        description: "Rich chocolate cupcakes with fudge icing",
        price: 1600,
        image: bakesFola,
      },
      {
        id: "cookies",
        name: "Chocolate Chip Cookies (6 pcs)",
        description: "Warm, chewy chocolate chip cookies",
        price: 1400,
        image: puffPuff,
      },
    ],
  },
  {
    key: "juice-bar",
    name: "The Juice Bar",
    subtitle: "Fresh Juices • Shakes",
    category: "Juices & Shakes",
    rating: "4.5",
    reviewCount: 87,
    time: "10–15 min",
    distance: "0.4 km",
    status: "Open",
    closesAt: "9 PM",
    image: zeeDrinks,
    about: "Cold-pressed juices and milkshakes made fresh on order.",
    menuCategories: ["All", "Juices", "Shakes"],
    menu: [
      {
        id: "pineapple-juice",
        name: "Pineapple Juice",
        description: "Freshly pressed pineapple juice",
        price: 1200,
        image: zeeDrinks,
      },
      {
        id: "banana-shake",
        name: "Banana Shake",
        description: "Creamy banana milkshake",
        price: 1700,
        image: zeeDrinks,
      },
    ],
  },
  {
    key: "noodle-spot",
    name: "Noodle Spot",
    subtitle: "Noodles • Stir Fry",
    category: "Noodles & Stir Fry",
    rating: "4.6",
    reviewCount: 119,
    time: "15–20 min",
    distance: "0.6 km",
    status: "Open",
    closesAt: "10 PM",
    image: campusBites,
    about: "Stir-fried noodles loaded with veggies and your choice of protein.",
    menuCategories: ["All", "Noodles", "Sides"],
    menu: [
      {
        id: "chicken-noodles",
        name: "Chicken Stir-Fry Noodles",
        description: "Stir-fried noodles with chicken and mixed vegetables",
        price: 2400,
        image: friedRice,
      },
      {
        id: "veg-noodles",
        name: "Vegetable Noodles",
        description: "Stir-fried noodles with garden vegetables",
        price: 2000,
        image: efoRiro,
      },
    ],
  },
  {
    key: "tasty-corner",
    name: "Tasty Corner",
    subtitle: "Rice • Swallow",
    category: "Rice & Swallow",
    rating: "4.9",
    reviewCount: 203,
    time: "20–30 min",
    distance: "0.8 km",
    status: "Popular",
    closesAt: "10 PM",
    image: mamaT,
    about: "Classic Nigerian swallow and soups, made the traditional way.",
    menuCategories: ["All", "Swallow", "Soups", "Rice"],
    menu: [
      {
        id: "eba-egusi",
        name: "Eba & Egusi Soup",
        description: "Smooth eba served with rich egusi soup and meat",
        price: 2600,
        image: efoRiro,
      },
      {
        id: "amala-ewedu",
        name: "Amala & Ewedu",
        description: "Amala served with ewedu and gbegiri soup",
        price: 2500,
        image: mamaT,
      },
      {
        id: "jollof-tc",
        name: "Jollof Rice",
        description: "Classic smoky jollof rice",
        price: 2200,
        image: jollofChicken,
      },
    ],
  },
  {
    key: "bread-basket",
    name: "Bread Basket",
    subtitle: "Bread • Meat Pies",
    category: "Bakery",
    rating: "4.4",
    reviewCount: 76,
    time: "10–20 min",
    distance: "0.5 km",
    status: "Open",
    closesAt: "8 PM",
    image: bakesFola,
    about: "Freshly baked bread and savory pastries, straight from the oven.",
    menuCategories: ["All", "Bread", "Pastries"],
    menu: [
      {
        id: "meat-pie-bb",
        name: "Meat Pie (2 pcs)",
        description: "Flaky pastry filled with seasoned minced meat",
        price: 900,
        image: bakesFola,
      },
      {
        id: "sausage-roll",
        name: "Sausage Roll (2 pcs)",
        description: "Buttery pastry wrapped around seasoned sausage",
        price: 800,
        image: puffPuff,
      },
      {
        id: "loaf",
        name: "Fresh Loaf",
        description: "Soft freshly baked bread loaf",
        price: 1000,
        image: bakesFola,
      },
    ],
  },
  {
    key: "smoothie-hub",
    name: "Smoothie Hub",
    subtitle: "Smoothies • Bowls",
    category: "Smoothies & Bowls",
    rating: "4.7",
    reviewCount: 132,
    time: "10–15 min",
    distance: "0.3 km",
    status: "Open",
    closesAt: "9 PM",
    image: zeeDrinks,
    about: "Smoothie bowls and blends packed with fresh fruit.",
    menuCategories: ["All", "Smoothies", "Bowls"],
    menu: [
      {
        id: "berry-bowl",
        name: "Berry Smoothie Bowl",
        description: "Mixed berry smoothie bowl topped with granola",
        price: 2200,
        image: zeeDrinks,
      },
      {
        id: "mango-smoothie-sh",
        name: "Mango Smoothie",
        description: "Fresh mango blended with yogurt",
        price: 1800,
        image: zeeDrinks,
      },
    ],
  },
  {
    key: "rice-republic",
    name: "Rice Republic",
    subtitle: "Fried Rice • Salad",
    category: "Rice & Salads",
    rating: "4.8",
    reviewCount: 189,
    time: "15–20 min",
    distance: "0.4 km",
    status: "Open",
    closesAt: "10 PM",
    image: campusBites,
    about: "Rice bowls and fresh salads, made to order.",
    menuCategories: ["All", "Rice", "Salads"],
    menu: [
      {
        id: "fried-rice-rr",
        name: "Fried Rice",
        description: "Tasty fried rice with mixed vegetables",
        price: 2200,
        image: friedRice,
      },
      {
        id: "chicken-salad",
        name: "Chicken Salad",
        description: "Grilled chicken over fresh garden salad",
        price: 2400,
        image: efoRiro,
      },
    ],
  },
  {
    key: "pastry-place",
    name: "Pastry Place",
    subtitle: "Croissants • Donuts",
    category: "Pastries & Donuts",
    rating: "4.6",
    reviewCount: 104,
    time: "15–25 min",
    distance: "0.6 km",
    status: "Popular",
    closesAt: "8 PM",
    image: bakesFola,
    about: "Buttery croissants and fresh donuts, baked daily.",
    menuCategories: ["All", "Croissants", "Donuts"],
    menu: [
      {
        id: "croissant",
        name: "Butter Croissant (2 pcs)",
        description: "Flaky, buttery croissants",
        price: 1300,
        image: bakesFola,
      },
      {
        id: "donut",
        name: "Glazed Donuts (4 pcs)",
        description: "Soft glazed donuts",
        price: 1400,
        image: puffPuff,
      },
    ],
  },
  {
    key: "campus-grill",
    name: "Campus Grill",
    subtitle: "Burgers • Grills",
    category: "Burgers & Grills",
    rating: "4.5",
    reviewCount: 92,
    time: "20–25 min",
    distance: "0.9 km",
    status: "Open",
    closesAt: "10 PM",
    image: mamaT,
    about: "Juicy burgers and grilled favorites, made fresh to order.",
    menuCategories: ["All", "Burgers", "Grills"],
    menu: [
      {
        id: "beef-burger",
        name: "Classic Beef Burger",
        description: "Grilled beef patty with lettuce, cheese and sauce",
        price: 2800,
        image: campusBites,
      },
      {
        id: "chicken-burger",
        name: "Grilled Chicken Burger",
        description: "Grilled chicken breast burger with mayo",
        price: 2600,
        image: mamaT,
      },
    ],
  },
  {
    key: "waffle-works",
    name: "Waffle Works",
    subtitle: "Waffles • Pancakes",
    category: "Waffles & Pancakes",
    rating: "4.8",
    reviewCount: 158,
    time: "10–20 min",
    distance: "0.4 km",
    status: "Popular",
    closesAt: "8 PM",
    image: bakesFola,
    about: "Warm waffles and fluffy pancakes, made to order with your choice of toppings.",
    menuCategories: ["All", "Waffles", "Pancakes"],
    menu: [
      {
        id: "waffle",
        name: "Belgian Waffle",
        description: "Crispy waffle with maple syrup and butter",
        price: 2000,
        image: bakesFola,
      },
      {
        id: "pancakes",
        name: "Stack of Pancakes (3 pcs)",
        description: "Fluffy pancakes with maple syrup",
        price: 1900,
        image: puffPuff,
      },
    ],
  },
];

export function getVendor(key: string | undefined) {
  return vendors.find((v) => v.key === key);
}
