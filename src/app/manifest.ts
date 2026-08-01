import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeOS — Your Personal Operating System',
    short_name: 'LifeOS',
    description:
      'A modern, full-stack personal operating system for managing notes, tasks, calendar, habits, and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#0F172A',
    icons: [
      { src: '/app-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      { src: '/app-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/icon.svg', sizes: '170x170', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
