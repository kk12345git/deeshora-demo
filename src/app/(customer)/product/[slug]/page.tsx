// src/app/(customer)/product/[slug]/page.tsx
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductDetailsClient from './ProductDetailsClient';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      vendor: { select: { id: true, shopName: true, city: true } },
      reviews: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } }
      }
    }
  });
  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product Not Found' };

  const description = product.description.replace(/<[^>]*>?/gm, '').slice(0, 160);

  return {
    title: `${product.name} | Deeshora Thiruvottriyur`,
    description: `${description}... Buy ${product.name} from ${product.vendor.shopName} in Thiruvottriyur, Chennai for ₹${product.price}.`,
    keywords: [product.name, product.category.name, product.vendor.shopName, "Thiruvottriyur delivery", "Chennai local shops"],
    openGraph: {
      title: `${product.name} - Instant Delivery in Chennai`,
      description: `Get ${product.name} delivered in minutes from ${product.vendor.shopName}.`,
      images: [
        {
          url: product.images[0],
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: `Buy ${product.name} on Deeshora. Local delivery in Thiruvottriyur.`,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  // Next.js automatically serializes the data passed to Client Components.
  // We sanitize the dates for full safety.
  const serializableProduct = JSON.parse(JSON.stringify(product));

  return <ProductDetailsClient product={serializableProduct} />;
}