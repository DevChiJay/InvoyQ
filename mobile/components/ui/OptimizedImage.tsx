import { Image, ImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string };
  blurhash?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Optimized image component with caching and lazy loading
 * Uses expo-image for better performance than React Native's Image
 */
export function OptimizedImage({ 
  source, 
  blurhash = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
  priority = 'normal',
  contentFit = 'cover',
  transition = 200,
  ...props 
}: OptimizedImageProps) {
  const uri = typeof source === 'string' ? source : source.uri;

  return (
    <Image
      source={{ uri }}
      placeholder={blurhash}
      contentFit={contentFit}
      transition={transition}
      priority={priority}
      cachePolicy="memory-disk"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f0f0f0',
  },
});
