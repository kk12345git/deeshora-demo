// src/components/seo/Breadcrumbs.tsx
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deeshora.com';
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${baseUrl}${item.href}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap py-2 px-1">
        <Link href="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
          <Home size={12} />
          <span>Home</span>
        </Link>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
            <Link 
              href={item.href} 
              className={`transition-colors flex-shrink-0 ${item.active ? 'text-gray-950 pointer-events-none' : 'hover:text-orange-500'}`}
            >
              {item.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}
