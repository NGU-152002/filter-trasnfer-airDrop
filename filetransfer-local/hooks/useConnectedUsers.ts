import { useState, useEffect, useCallback } from 'react';

export interface ConnectedUser {
  id: number;
  name: string;
  distance: number;
  size: number;
  speed: number;
  color: string;
  isOnline: boolean;
  joinedAt: Date;
}

interface UseConnectedUsersReturn {
  users: ConnectedUser[];
  isLoading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  getUserCount: () => number;
}

// Color palette for users
const COLOR_PALETTE = [
  'bg-blue-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
];

// Orbital parameters
const ORBITAL_CONFIG = [
  { distance: 80, size: 30, speed: 10 },
  { distance: 130, size: 25, speed: 15 },
  { distance: 180, size: 28, speed: 20 },
  { distance: 230, size: 22, speed: 25 },
  { distance: 280, size: 26, speed: 30 },
  { distance: 330, size: 24, speed: 35 },
  { distance: 380, size: 27, speed: 40 },
  { distance: 430, size: 23, speed: 45 },
  { distance: 480, size: 29, speed: 50 },
  { distance: 530, size: 21, speed: 55 },
];

export const useConnectedUsers = (): UseConnectedUsersReturn => {
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/transfer');

      if (!response.ok) {
        throw new Error('Failed to fetch connected users');
      }

      const data = await response.json();

      if (data.success && data.users && Array.isArray(data.users)) {
        // Transform API response into ConnectedUser objects with orbital parameters
        const connectedUsers: ConnectedUser[] = data.users.map(
          (user: any, index: number) => {
            const orbitConfig = ORBITAL_CONFIG[index % ORBITAL_CONFIG.length];
            const color = COLOR_PALETTE[index % COLOR_PALETTE.length];

            return {
              id: user.id,
              name: user.userName || `User ${user.id}`,
              distance: orbitConfig.distance,
              size: orbitConfig.size,
              speed: orbitConfig.speed,
              color,
              isOnline: true,
              joinedAt: new Date(),
            };
          }
        );

        setUsers(connectedUsers);
        console.log(`✓ Discovered ${connectedUsers.length} connected user(s)`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and periodic refresh with heartbeat
  useEffect(() => {
    refreshUsers();

    // Send heartbeat and refresh every 3 seconds (aggressive cleanup)
    const interval = setInterval(refreshUsers, 3000);

    return () => clearInterval(interval);
  }, [refreshUsers]);

  const getUserCount = useCallback(() => {
    return users.filter(u => u.isOnline).length;
  }, [users]);

  return {
    users: users.filter(u => u.isOnline),
    isLoading,
    error,
    refreshUsers,
    getUserCount,
  };
};
