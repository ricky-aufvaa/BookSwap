import { createAvatar } from '@dicebear/core';
import { croodles } from '@dicebear/collection';

export interface Avatar {
  seed: string;
  svg: string;
}

// Generate 30 avatars as requested
export const generateAvatars = (): Avatar[] => {
  const avatarCount = 30;
  const avatars: Avatar[] = [];

  for (let i = 1; i <= avatarCount; i++) {
    const seed = i.toString();
    const svg = createAvatar(croodles, { seed });
    avatars.push({ seed, svg: svg.toString() });
  }

  return avatars;
};

// Get a specific avatar by seed
export const getAvatarBySeed = (seed: string): string => {
  const svg = createAvatar(croodles, { seed });
  return svg.toString();
};

// Generate a random avatar seed
export const generateRandomAvatarSeed = (): string => {
  return Math.floor(Math.random() * 30 + 1).toString();
};

// Pre-generated avatars for selection
export const AVATAR_SEEDS = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
