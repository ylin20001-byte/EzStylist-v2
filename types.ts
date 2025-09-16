/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Centralize pose and background constants to be used for strict typing across components.
export const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
] as const;
export type PoseInstruction = typeof POSE_INSTRUCTIONS[number];

export const BACKGROUND_OPTIONS = [
    "Default",
    "Studio Background",
    "A Parisian street cafe",
    "A futuristic neon-lit alley",
    "A serene beach at sunset",
    "An elegant library with wooden shelves",
    "A lush botanical garden"
] as const;
export type BackgroundOption = typeof BACKGROUND_OPTIONS[number];

export const LIGHTING_OPTIONS = [
    "Default",
    "Bright studio lighting",
    "Warm, golden hour lighting",
    "Dramatic, cinematic lighting",
    "Soft, diffused lighting",
] as const;
export type LightingOption = typeof LIGHTING_OPTIONS[number];

export const LOOKBOOK_TEMPLATES = {
    'Minimalist Grid': 'A clean, minimalist grid layout with generous white space.',
    'Magazine Spread': 'A dynamic, overlapping magazine-style spread with bold typography.',
    'Film Strip': 'A vertical or horizontal film strip sequence.',
    'Polaroid Collage': 'A scattered collage of polaroid-style photos.',
} as const;
export type LookbookTemplate = keyof typeof LOOKBOOK_TEMPLATES;

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category: 'top' | 'accessory';
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  // FIX: Use a more specific record type where keys are known pose instructions.
  poseImages: Partial<Record<PoseInstruction, string>>; // Maps pose instruction to image URL
  // FIX: Use a more specific record type for background images.
  backgroundModifiedImages?: Partial<Record<PoseInstruction, string>>; // Maps pose instruction to image URL with a custom background
  lightingModifiedImages?: Partial<Record<PoseInstruction, string>>; // Maps pose instruction to image URL with a custom lighting
}
