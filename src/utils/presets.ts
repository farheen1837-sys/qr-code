/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetTheme } from '../types';

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'classic-dark',
    name: 'Classic Dark',
    fgColor: '#09090b', // Slate 950
    bgColor: '#ffffff', // White
    eyeColor: '#09090b',
    badgeBgColor: '#ffffff',
    description: 'High-contrast monochrome, ultra-reliable scanning.',
  },
  {
    id: 'sunset-gold',
    name: 'Sunset Glow',
    fgColor: '#ea580c', // Orange 600
    bgColor: '#fdfaee', // Soft amber tint
    eyeColor: '#7c2d12', // Deep orange-brown eyes
    badgeBgColor: '#ffffff',
    description: 'Warm, inviting autumnal tones perfect for cafes and venues.',
  },
  {
    id: 'emerald-forest',
    name: 'Forest Moss',
    fgColor: '#059669', // Emerald 600
    bgColor: '#f0fdf4', // Soft mint tint
    eyeColor: '#064e3b', // Deep green eyes
    badgeBgColor: '#ffffff',
    description: 'Natural eco-friendly vibes for organics and gardening.',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Cyber Neon',
    fgColor: '#06b6d4', // Cyan 500
    bgColor: '#0f172a', // Slate 900
    eyeColor: '#ec4899', // Pink 500 eyes
    badgeBgColor: '#1e293b',
    description: 'High-octane synthwave palette with electric pink eyes.',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Grape',
    fgColor: '#7c3aed', // Violet 600
    bgColor: '#faf5ff', // Purple 50
    eyeColor: '#4c1d95', // Deep purple eyes
    badgeBgColor: '#ffffff',
    description: 'Elegant, premium purple styling for luxury and creatives.',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Coast',
    fgColor: '#2563eb', // Blue 600
    bgColor: '#f0f9ff', // Blue 50
    eyeColor: '#1e3a8a', // Dark blue eyes
    badgeBgColor: '#ffffff',
    description: 'Professional marine tones suited for corporate and travel.',
  }
];

export interface PresetLogo {
  id: string;
  name: string;
  color: string;
  svgString: string;
}

export const PRESET_LOGOS: PresetLogo[] = [
  {
    id: 'link',
    name: 'Link',
    color: '#3b82f6',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>`
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    color: '#059669',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h.01" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M1.5 9.5a15 15 0 0 1 21 0" />
    </svg>`
  },
  {
    id: 'email',
    name: 'Email',
    color: '#ea580c',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>`
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#22c55e',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M17 14c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2-.1-.4-.2-.5c-.1-.2-.6-1.5-.8-2-.2-.5-.5-.5-.7-.5h-.5c-.2 0-.5.1-.7.3A2.86 2.86 0 0 0 6 9c0 1.5.6 2.9 1.5 4.1 1.9 2.5 4 4.1 6.5 4.9.7.2 1.4.3 2.1.2 1-.1 1.9-.6 2.4-1.4.2-.3.3-.7.2-1.1-.1-.3-.3-.4-1.7-1.1z" />
    </svg>`
  },
  {
    id: 'phone',
    name: 'Phone',
    color: '#0ea5e9',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>`
  },
  {
    id: 'star',
    name: 'Rating / Star',
    color: '#eab308',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>`
  },
  {
    id: 'heart',
    name: 'Heart / Love',
    color: '#f43f5e',
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>`
  }
];

export function getSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}
