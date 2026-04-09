// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadImage } from '@/lib/cloudinary';


export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }


  try {
    const { image } = await req.json();
    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }


    const imageUrl = await uploadImage(image, 'user-uploads');
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}