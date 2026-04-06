import {
  SiGithub,
  SiYoutube,
  SiInstagram,
  SiTiktok,
  SiReddit,
} from 'react-icons/si';
import { FileText } from 'lucide-react';

function LinkedInIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

const SIZE = 24;

// Official Simple Icons brand hex colors
const SI_ICONS = {
  github:    { Icon: SiGithub,    color: '#181717' },
  youtube:   { Icon: SiYoutube,   color: '#FF0000' },
  instagram: { Icon: SiInstagram, color: '#E4405F' },
  tiktok:    { Icon: SiTiktok,    color: '#000000' },
  reddit:    { Icon: SiReddit,    color: '#FF4500' },
};

export function detectSource(url) {
  if (!url) return 'article';
  const host = url.toLowerCase();
  if (host.includes('github.com'))                               return 'github';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('instagram.com'))                            return 'instagram';
  if (host.includes('tiktok.com'))                               return 'tiktok';
  if (host.includes('linkedin.com'))                             return 'linkedin';
  if (host.includes('reddit.com'))                               return 'reddit';
  return 'article';
}

export default function SourceIcon({ source }) {
  const brand = SI_ICONS[source];

  if (brand) {
    return <brand.Icon size={SIZE} color={brand.color} />;
  }

  if (source === 'linkedin') {
    return <LinkedInIcon size={SIZE} />;
  }

  // Article / unknown — follows theme text color
  return <FileText size={SIZE} />;
}
