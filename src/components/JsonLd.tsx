// src/components/JsonLd.tsx
import React from 'react';

interface JsonLdProps {
  type?: 'Product' | 'LocalBusiness' | 'Store' | 'Organization' | 'Service';
  data?: any;
}

export default function JsonLd({ type, data }: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://Daily1Mart.com';
  
  // Default Organization & Service Schema (Global)
  if (!type) {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Daily1Mart",
      "url": baseUrl,
      "logo": `${baseUrl}/logo.png`,
      "description": "Premium hyperlocal delivery platform connecting local shops with customers for instant delivery of groceries, food, and essentials. Serving Thiruvottriyur, Chennai, and beyond.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      },
      "sameAs": [
        "https://facebook.com/Daily1Mart",
        "https://instagram.com/Daily1Mart",
        "https://twitter.com/Daily1Mart"
      ]
    };

    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Hyperlocal Delivery",
      "provider": {
        "@type": "LocalBusiness",
        "name": "Daily1Mart Local Marketplace"
      },
      "areaServed": {
        "@type": "City",
        "name": "Thiruvottriyur",
        "containedInPlace": {
          "@type": "City",
          "name": "Chennai"
        }
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

  // Dynamic Schema Injection
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": type,
        ...data
      }) }}
    />
  );
}
