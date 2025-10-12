// Avatar system constants and utilities
export const AVATAR_TYPES = {
  AVATARA: 'avatara',
  AVATARB: 'avatarb', 
  AVATARC: 'avatarc',
  AVATARD: 'avatard',
  AVATARE: 'avatare'
};

export const AVATAR_NAMES = {
  [AVATAR_TYPES.AVATARA]: 'Sol',
  [AVATAR_TYPES.AVATARB]: 'Luna',
  [AVATAR_TYPES.AVATARC]: 'Nova',
  [AVATAR_TYPES.AVATARD]: 'Sage',
  [AVATAR_TYPES.AVATARE]: 'Echo'
};

export const SUPPORTED_AVATAR_TYPES = Object.values(AVATAR_TYPES);

export const MAX_EVOLUTION_LEVEL = 4;
export const MIN_EVOLUTION_LEVEL = 1;

/**
 * Get avatar image path by type and level
 * @param {string} avatarType - The avatar type (avatara, avatarb, etc.)
 * @param {number} level - The evolution level (1-4)
 * @returns {string} The image path
 */
export function getAvatarImageByTypeAndLevel(avatarType, level) {
  if (!SUPPORTED_AVATAR_TYPES.includes(avatarType)) {
    return '/assets/avatara.png'; // fallback to default
  }
  
  // Clamp level between 1 and 4
  const clampedLevel = Math.max(MIN_EVOLUTION_LEVEL, Math.min(MAX_EVOLUTION_LEVEL, level));
  
  // Generate the image path
  if (clampedLevel === 1) {
    return `/assets/${avatarType}.png`;
  } else {
    return `/assets/${avatarType}${clampedLevel}.png`;
  }
}

/**
 * Get avatar display name
 * @param {string} avatarType - The avatar type
 * @returns {string} The display name
 */
export function getAvatarDisplayName(avatarType) {
  const customName = sessionStorage.getItem('avatarCustomName');
  if (customName && customName.trim()) {
    return customName.trim();
  }
  
  return AVATAR_NAMES[avatarType] || 'Avatar';
}

/**
 * Check if avatar type supports evolution
 * @param {string} avatarType - The avatar type to check
 * @returns {boolean} Whether the avatar type supports evolution
 */
export function isEvolutionSupportedAvatar(avatarType) {
  return SUPPORTED_AVATAR_TYPES.includes(avatarType);
}

/**
 * Get current avatar evolution level from sessionStorage
 * @returns {number} The current evolution level
 */
export function getCurrentEvolutionLevel() {
  return parseInt(sessionStorage.getItem('avatarEvolutionLevel') || '1');
}

/**
 * Set avatar evolution level in sessionStorage
 * @param {number} level - The new evolution level
 */
export function setEvolutionLevel(level) {
  const clampedLevel = Math.max(MIN_EVOLUTION_LEVEL, Math.min(MAX_EVOLUTION_LEVEL, level));
  sessionStorage.setItem('avatarEvolutionLevel', clampedLevel.toString());
}