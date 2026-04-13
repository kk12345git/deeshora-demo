// src/app/(customer)/category/[slug]/page.tsx
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import CategoryDetailsClient from './CategoryDetailsClient';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
  });
  return category;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.slug);
  if (!category) return { title: 'Category Not Found' };

  // Map category to Cheerful OG image
  let ogImage = '/og-main.jpg';
  if (params.slug.includes('grocery')) ogImage = '/og/og-grocery.png';
  else if (params.slug.includes('electronic')) ogImage = '/og/og-electronics.png';
  else if (params.slug.includes('gift') || params.slug.includes('fashion')) ogImage = '/og/og-gifts.png';

  return {
    title: `${category.name} | Best Selection in Thiruvottriyur`,
    description: `Browse the best ${category.name} in Thiruvottriyur, Chennai. Instant delivery from top local shops at Deeshora.`,
    keywords: [category.name, "Thiruvottriyur category", "Chennai local delivery", "Deeshora Chennai"],
    openGraph: {
      title: `${category.name} - Instant Delivery in Chennai`,
      description: `Shop the freshest and best ${category.name} in Thiruvottriyur today.`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${category.name} in Thiruvottriyur`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: category.name,
      description: `Buy ${category.name} on Deeshora. Delivered fast in Chennai.`,
      images: [ogImage],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  return <CategoryDetailsClient slug={params.slug} categoryName={category.name} />;
}
