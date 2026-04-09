// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deeshora.com';

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  // Fetch all active products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const categoryEntries = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const productEntries = products.map((prod) => ({
    url: `${baseUrl}/product/${prod.slug}`,
    lastModified: prod.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
        url: `${baseUrl}/vendor/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.4,
    }
  ];

  return [...staticPages, ...categoryEntries, ...productEntries];
}
