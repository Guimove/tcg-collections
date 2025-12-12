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
 * Charge automatiquement le format WebP si disponible, sinon utilise le PNG original
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

  return (
    <picture onClick={onClick}>
      {/* Source WebP (chargée en priorité si supportée) */}
      <source srcSet={webpSrc} type="image/webp" />

      {/* Fallback PNG/JPG pour navigateurs anciens */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onError={onError}
      />
    </picture>
  );
}
