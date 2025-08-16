import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ImageCard.module.css';

const ImageCard = ({ image, alt, isLoading, onLoad, onError }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Resetar os estados quando a imagem mudar
    setImgLoaded(false);
    setImgError(false);
    
    // Pré-carregar a imagem
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => setImgLoaded(true);
      img.onerror = () => setImgError(true);
    }
  }, [image]);

  const handleLoad = (e) => {
    setImgLoaded(true);
    setImgError(false);
    onLoad?.();
  };

  const handleError = (e) => {
    setImgError(true);
    setImgLoaded(false);
    onError?.();
  };

  if (!image || imgError) {
    return (
      <div className={`card ${styles.imageCard}`}>
        <div className={styles.imagePlaceholder}>
          <span>Sem Imagem</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${styles.imageCard}`}>
      {(isLoading || !imgLoaded) && <div className={styles.imageSkeleton} />}
      <img
        src={image}
        alt={alt}
        className={styles.itemImage}
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: imgLoaded ? 1 : 0 }}
        loading="eager"
        key={image}
      />
    </div>
  );
};

ImageCard.propTypes = {
  image: PropTypes.string,
  alt: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

ImageCard.defaultProps = {
  isLoading: false
};

export default React.memo(ImageCard);