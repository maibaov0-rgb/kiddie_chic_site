"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Review {
  id: string;
  name: string;
  comment: string;
  rating: number; // 1..5
  createdAt: number;
}

interface ReviewsState {
  reviews: Review[];
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
}

// Seed shown to first-time visitors so the home marquee isn't empty.
const SEED: Review[] = [
  {
    id: "seed-1",
    name: "Олена К.",
    rating: 5,
    comment:
      "Сукня — справжня казка! Якість тканини на висоті, доця почувається принцесою. Дякую за чудовий сервіс ♡",
    createdAt: Date.parse("2026-04-12T10:00:00Z"),
  },
  {
    id: "seed-2",
    name: "Марія В.",
    rating: 5,
    comment:
      "Замовляли на день народження — приїхало вчасно, упаковано як подарунок. Будемо повертатись ще!",
    createdAt: Date.parse("2026-05-02T13:30:00Z"),
  },
  {
    id: "seed-3",
    name: "Юлія С.",
    rating: 5,
    comment:
      "Дуже приємний шоу-рум у Києві, консультантка допомогла обрати правильний розмір. Сукня — мрія.",
    createdAt: Date.parse("2026-05-18T11:15:00Z"),
  },
  {
    id: "seed-4",
    name: "Анастасія П.",
    rating: 4,
    comment:
      "Тканина дуже ніжна, шов акуратний. Розмір трохи більший — варто враховувати при виборі.",
    createdAt: Date.parse("2026-05-30T16:45:00Z"),
  },
  {
    id: "seed-5",
    name: "Наталія Б.",
    rating: 5,
    comment:
      "Купуємо вже другу сукню у Kiddie Chic. Якість, увага до деталей — все, як обіцяли. Рекомендую!",
    createdAt: Date.parse("2026-06-08T09:20:00Z"),
  },
];

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set) => ({
      reviews: SEED,
      addReview: (r) =>
        set((state) => ({
          reviews: [
            {
              ...r,
              id: `r-${Date.now().toString(36)}`,
              createdAt: Date.now(),
            },
            ...state.reviews,
          ],
        })),
    }),
    {
      name: "kiddie-chic-reviews",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
