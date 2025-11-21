/**
 * File Transfer Configuration
 * Customize these settings for your deployment
 */

export const transferConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  // User Configuration
  user: {
    defaultUserId: 1,
    maxUsers: 100,
    userIdRange: { min: 1, max: 100 },
  },

  // File Transfer Configuration
  transfer: {
    chunkSize: 1024 * 1024, // 1MB chunks
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxConcurrentTransfers: 5,
    transferTimeout: 300000, // 5 minutes
  },

  // Network Configuration
  network: {
    discoveryInterval: 5000, // 5 seconds
    heartbeatInterval: 10000, // 10 seconds
    maxOfflineTime: 30000, // 30 seconds before marking as offline
  },

  // UI Configuration
  ui: {
    theme: 'dark', // 'dark' or 'light'
    animationDuration: {
      orbit: 10, // seconds
      fadeIn: 300, // milliseconds
      fadeOut: 300,
    },
    planets: [
      {
        id: 1,
        name: 'User 1',
        color: 'bg-blue-500',
        distance: 80,
        size: 30,
        speed: 10,
      },
      {
        id: 2,
        name: 'User 2',
        color: 'bg-red-500',
        distance: 130,
        size: 25,
        speed: 15,
      },
      {
        id: 3,
        name: 'User 3',
        color: 'bg-yellow-500',
        distance: 180,
        size: 28,
        speed: 20,
      },
      {
        id: 4,
        name: 'User 4',
        color: 'bg-green-500',
        distance: 230,
        size: 22,
        speed: 25,
      },
    ],
  },

  // Storage Configuration
  storage: {
    downloadDir: '~/Downloads/FileTransfer',
    useCustomDir: false,
    customDir: '', // Set if useCustomDir is true
  },

  // Logging Configuration
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    logToConsole: true,
    logToFile: false,
  },

  // Security Configuration
  security: {
    requireAuthentication: false,
    encryptFiles: false, // Future feature
    validateFileTypes: false,
    allowedFileTypes: [], // Empty = all types allowed
    scanForViruses: false, // Future feature
  },
};

// Helper functions
export const getTransferConfig = () => transferConfig;

export const updateTransferConfig = (updates: Partial<typeof transferConfig>) => {
  Object.assign(transferConfig, updates);
};

export const getPlanetConfig = (userId: number) => {
  return transferConfig.ui.planets.find(p => p.id === userId);
};

export const getApiUrl = () => {
  return transferConfig.api.baseUrl;
};

export const getDownloadDir = () => {
  if (transferConfig.storage.useCustomDir) {
    return transferConfig.storage.customDir;
  }
  return transferConfig.storage.downloadDir;
};
