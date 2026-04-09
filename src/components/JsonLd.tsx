// src/components/JsonLd.tsx
import React from 'react';

export default function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deeshora.com';
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Deeshora",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Premium hyperlocal delivery platform connecting local shops with customers for instant delivery of groceries, food, and essentials.",
    "sameAs": [
      "https://facebook.com/deeshora",
      "https://instagram.com/deeshora",
      "https://twitter.com/deeshora"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Hyperlocal Delivery",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Deeshora Local Marketplace"
    },
    "areaServed": {
        "@type": "Country",
        "name": "India"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Local Shop Catalog",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Grocery Delivery"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Local Restaurant Delivery"
          }
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
}
