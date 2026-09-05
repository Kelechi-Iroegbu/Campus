export type OrderStatus = "preparing" | "ready" | "picked-up" | "completed";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: number;
  icon?: string;
};

export type Order = {
  id: string;
  vendorName: string;
  vendorAddress: string;
  vendorLogoImage?: number;
  vendorLogoText?: string;
  vendorLogoBg?: string;
  vendorLogoColor?: string;
  thumbnail: number;
  status: OrderStatus;
  date: string;
  time: string;
  etaWindow?: string;
  etaMinutes?: string;
  total: number;
  items: OrderItem[];
};

const jollofChicken = require("@/assets/images/vendor/food-jollof-chicken.png");
const bakesFola = require("@/assets/images/home/vendor-bakes-fola.png");
const mamaT = require("@/assets/images/home/vendor-mama-t.png");
const zeeDrinks = require("@/assets/images/home/vendor-zee-drinks.png");

export const orders: Order[] = [
  {
    id: "CMPS4821",
    vendorName: "Crunch & Munch",
    vendorAddress: "University of Lagos, Akoka, Yaba",
    vendorLogoText: "C&M",
    vendorLogoBg: "#122C5C",
    vendorLogoColor: "#FF8A3D",
    thumbnail: jollofChicken,
    status: "preparing",
    date: "May 12, 2025",
    time: "7:30 PM",
    etaWindow: "7:40 PM - 7:50 PM",
    etaMinutes: "15–20 min",
    total: 4800,
    items: [
      {
        id: "jollof",
        name: "Jollof Rice with Chicken",
        quantity: 1,
        price: 2500,
        image: jollofChicken,
      },
      {
        id: "wings",
        name: "Spicy Chicken Wings",
        quantity: 1,
        price: 1800,
        icon: "flame-outline",
      },
      {
        id: "coke",
        name: "Grilled Coke (50cl)",
        quantity: 1,
        price: 500,
        image: zeeDrinks,
      },
    ],
  },
  {
    id: "CMPS4107",
    vendorName: "Craving Cones",
    vendorAddress: "University of Lagos, Akoka, Yaba",
    vendorLogoText: "CC",
    vendorLogoBg: "#E8491D",
    vendorLogoColor: "#FFFFFF",
    thumbnail: bakesFola,
    status: "completed",
    date: "May 10, 2025",
    time: "1:15 PM",
    total: 2200,
    items: [
      {
        id: "donuts",
        name: "Glazed Donuts (4 pcs)",
        quantity: 1,
        price: 2200,
        image: bakesFola,
      },
    ],
  },
  {
    id: "CMPS3091",
    vendorName: "Mama T's Kitchen",
    vendorAddress: "University of Lagos, Akoka, Yaba",
    vendorLogoImage: mamaT,
    thumbnail: mamaT,
    status: "completed",
    date: "May 8, 2025",
    time: "6:45 PM",
    total: 3600,
    items: [
      {
        id: "jollof2",
        name: "Jollof Rice & Chicken",
        quantity: 1,
        price: 2600,
        image: jollofChicken,
      },
      {
        id: "puffpuff",
        name: "Puff Puff (6 pcs)",
        quantity: 1,
        price: 1000,
        icon: "restaurant-outline",
      },
    ],
  },
];

export function getOrder(id?: string) {
  return orders.find((order) => order.id === id);
}
