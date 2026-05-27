// src/app/sitemap.ts
import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://Deeshora.com";
  const locales = ["en", "ta"];

  const staticPages: MetadataRoute.Sitemap = [];
  locales.forEach((locale) => {
    staticPages.push(
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/${locale}/search`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }
    );
  });

  try {
    // Fetch all categories
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });

    // Fetch all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const categoryEntries: MetadataRoute.Sitemap = [];
    categories.forEach((cat) => {
      locales.forEach((locale) => {
        categoryEntries.push({
          url: `${baseUrl}/${locale}/category/${cat.slug}`,
          lastModified: cat.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      });
    });

    const productEntries: MetadataRoute.Sitemap = [];
    products.forEach((prod) => {
      locales.forEach((locale) => {
        productEntries.push({
          url: `${baseUrl}/${locale}/product/${prod.slug}`,
          lastModified: prod.updatedAt,
          changeFrequency: "daily" as const,
          priority: 0.6,
        });
      });
    });

    return [...staticPages, ...categoryEntries, ...productEntries];
  } catch (error) {
    console.warn("Sitemap dynamic entries skipped during build (database connection not available):", error);
    return staticPages;
  }
}
