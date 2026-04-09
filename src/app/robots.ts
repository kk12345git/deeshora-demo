// src/app/robots.ts
import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deeshora.com'
 
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/vendor/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
