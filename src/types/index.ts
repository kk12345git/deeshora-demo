// src/types/index.ts
import { Product as PrismaProduct, Category as PrismaCategory, Review as PrismaReview, User as PrismaUser } from "@prisma/client";

export type ProductWithRelations = PrismaProduct & {
  category: Pick<PrismaCategory, "id" | "name" | "slug">;
  reviews: (PrismaReview & {
    user: Pick<PrismaUser, "id" | "name" | "avatar">;
  })[];
};

export type ProductSummary = Pick<
  PrismaProduct,
  "id" | "name" | "slug" | "price" | "mrp" | "stock" | "images" | "unit" | "isFeatured" | "rating" | "reviewCount" | "type" | "isCombo"
> & {
  category: Pick<PrismaCategory, "id" | "name" | "slug">;
};
