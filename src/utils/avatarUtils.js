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

export const GAME_TYPES = {
  WORDLE: 'wordle',
  MATCH3: 'match3',
  CATCHER: 'catcher'
};

export const GAME_NAMES = {
  [GAME_TYPES.WORDLE]: 'Wordle Game',
  [GAME_TYPES.MATCH3]: 'Match-3 Game',
  [GAME_TYPES.CATCHER]: 'Food Catcher'
};

export const SUPPORTED_AVATAR_TYPES = Object.values(AVATAR_TYPES);
export const ALL_GAMES = Object.values(GAME_TYPES);

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

/**
 * Get completed games from sessionStorage
 * @returns {Array<string>} Array of completed game types
 */
export function getCompletedGames() {
  return JSON.parse(sessionStorage.getItem('completedGames') || '[]');
}

/**
 * Get game progress information
 * @returns {Object} Game progress data
 */
export function getGameProgress() {
  const completedGames = getCompletedGames();
  const progress = {
    completed: completedGames,
    incomplete: ALL_GAMES.filter(game => !completedGames.includes(game)),
    totalGames: ALL_GAMES.length,
    completedCount: completedGames.length,
    progressPercentage: Math.round((completedGames.length / ALL_GAMES.length) * 100)
  };

  return progress;
}

/**
 * Get formatted game names for display
 * @param {Array<string>} gameTypes - Array of game type keys
 * @returns {Array<string>} Array of formatted game names
 */
export function getFormattedGameNames(gameTypes) {
  return gameTypes.map(gameType => GAME_NAMES[gameType] || gameType);
}