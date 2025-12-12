import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onClick?: (e: React.MouseEvent) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Composant d'image optimisé avec support WebP et fallback PNG
 * Essaie de charger le WebP, fallback automatique sur PNG si échec
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  loading = 'lazy',
  onClick,
  onError
}: OptimizedImageProps) {
  // Convertir l'extension en .webp pour la source WebP
  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const [imgSrc, setImgSrc] = useState(webpSrc);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Si on n'a pas encore essayé le fallback et qu'on est sur le webp
    if (!hasTriedFallback && imgSrc === webpSrc) {
      // Fallback vers le PNG original
      setImgSrc(src);
      setHasTriedFallback(true);
    } else if (onError) {
      // Si le PNG échoue aussi, appeler le onError du parent
      onError(e);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      onClick={onClick}
      onError={handleError}
    />
  );
}
