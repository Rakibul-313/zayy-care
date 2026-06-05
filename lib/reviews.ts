export type LocalReview = {
  id: number;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
};

const REVIEWS_KEY = "zayy_reviews";

export function getLocalReviews(): LocalReview[] {
  if (typeof window === "undefined") return [];

  const reviews = localStorage.getItem(REVIEWS_KEY);

  return reviews ? JSON.parse(reviews) : [];
}

export function saveLocalReviews(reviews: LocalReview[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export function addLocalReview(review: Omit<LocalReview, "id" | "date">) {
  const reviews = getLocalReviews();

  const newReview: LocalReview = {
    ...review,
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
  };

  const updatedReviews = [newReview, ...reviews];

  saveLocalReviews(updatedReviews);

  return updatedReviews;
}