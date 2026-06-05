export type Product = {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  oldPrice: number;
  sale: string;
  category: string;
  stock: boolean;
  rating: number;
  reviews: number;
  brand: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Anua Heartleaf Foam",
    slug: "anua-heartleaf-foam",
    image: "/products/p1.png",
    price: 1250,
    oldPrice: 1650,
    sale: "-24%",
    category: "Cleanser",
    stock: true,
    rating: 4.9,
    reviews: 120,
    brand: "Anua",
  },

  {
    id: 2,
    name: "COSRX Snail Essence",
    slug: "cosrx-snail-essence",
    image: "/products/p2.png",
    price: 1850,
    oldPrice: 2100,
    sale: "-12%",
    category: "Essence",
    stock: true,
    rating: 4.9,
    reviews: 120,
    brand: "COSRX",
  },

  {
    id: 3,
    name: "Axis-Y Glow Serum",
    slug: "axis-y-glow-serum",
    image: "/products/p3.png",
    price: 1450,
    oldPrice: 1850,
    sale: "-22%",
    category: "Serum",
    stock: true,
    rating: 4.9,
    reviews: 120,
    brand: "Axis-Y",
  },

  {
    id: 4,
    name: "Beauty Of Joseon",
    slug: "beauty-of-joseon",
    image: "/products/p4.png",
    price: 1350,
    oldPrice: 1650,
    sale: "-18%",
    category: "Sunscreen",
    stock: false,
    rating: 4.9,
    reviews: 120,
    brand: "BOJ",
  },

  {
    id: 5,
    name: "COSRX BHA Toner",
    slug: "cosrx-bha-toner",
    image: "/products/p5.png",
    price: 1650,
    oldPrice: 1950,
    sale: "-15%",
    category: "Toner",
    stock: true,
    rating: 4.9,
    reviews: 120,
    brand: "COSRX",
  },

  {
    id: 6,
    name: "Skin1004 Cream",
    slug: "skin1004-cream",
    image: "/products/p6.png",
    price: 1550,
    oldPrice: 1850,
    sale: "-10%",
    category: "Cream",
    stock: true,
    rating: 4.9,
    reviews: 120,
    brand: "Skin1004",
  },
];
