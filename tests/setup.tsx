import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- plain <img> stands in for next/image in tests
    <img src={src} alt={alt} {...rest} />
  ),
}));
