import './ProductPhoto.css';
import { BoxIcon } from './icons';

interface ProductPhotoProps {
  /** пока API не отдаёт фото товара — контейнер готов принять src, когда он появится */
  src?: string | null;
  alt: string;
  size?: 'thumb' | 'card' | 'detail';
}

export function ProductPhoto({ src, alt, size = 'card' }: ProductPhotoProps) {
  return (
    <div className={`product-photo product-photo--${size}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <BoxIcon className="product-photo__placeholder" aria-label={alt} />
      )}
    </div>
  );
}
