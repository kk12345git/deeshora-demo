// src/app/(customer)/vendor/[id]/page.tsx
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import VendorProfileClient from './VendorProfileClient';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

async function getVendor(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      products: {
        where: { isActive: true },
        include: { category: true }
      }
    }
  });
  return vendor;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vendor = await getVendor(params.id);
  if (!vendor) return { title: 'Shop Not Found' };

  return {
    title: `${vendor.shopName} | Verified Shop in Thiruvottriyur`,
    description: `Shop from ${vendor.shopName} in ${vendor.city}, Chennai. Browse their catalog of ${vendor.category} and get instant delivery via Deeshora.`,
    keywords: [vendor.shopName, vendor.category, "Thiruvottriyur shop", "Chennai local delivery", "Deeshora vendor"],
    openGraph: {
      title: `${vendor.shopName} - Local Marketplace Chennai`,
      description: `Support local! Shop from ${vendor.shopName} for ${vendor.category} with 10-minute delivery in Thiruvottriyur.`,
      images: [
        {
          url: vendor.logo || vendor.coverImage || '/og-main.jpg',
          width: 1200,
          height: 630,
          alt: vendor.shopName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: vendor.shopName,
      description: `Buy from ${vendor.shopName} on Deeshora. Local delivery in Chennai.`,
      images: [vendor.logo || '/og-main.jpg'],
    },
  };
}

export default async function VendorPublicPage({ params }: Props) {
  const vendor = await getVendor(params.id);
  if (!vendor) notFound();

  const serializableVendor = JSON.parse(JSON.stringify(vendor));

  return <VendorProfileClient vendor={serializableVendor} />;
}
