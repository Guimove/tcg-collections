import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl || !imageUrl.startsWith('https://images.ygoprodeck.com/')) {
    return new Response('Invalid image URL', { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new Response('Image not found', { status: 404 });
    }

    const response = new Response(imageResponse.body, {
      status: imageResponse.status,
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 an
        'Access-Control-Allow-Origin': '*',
      },
    });

    return response;
  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response('Error fetching image', { status: 500 });
  }
};

export const config = {
  path: "/api/card-image",
};
