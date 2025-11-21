/**
 * Network Service - Handles discovery and communication with other users
 */

interface User {
  id: number;
  name: string;
  ipAddress: string;
  isOnline: boolean;
  lastSeen: Date;
}

class NetworkService {
  private users: Map<number, User> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize network service and start discovering users
   */
  async initializeNetwork(userId: number, userName: string) {
    try {
      // Register current user
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          ipAddress: window.location.hostname
        })
      });

      if (response.ok) {
        console.log(`✓ Registered as ${userName} (ID: ${userId})`);
        // Start periodic refresh
        this.startDiscovery();
      }
    } catch (error) {
      console.error('Failed to initialize network:', error);
    }
  }

  /**
   * Start discovering users on the network
   */
  private startDiscovery() {
    // Discover users every 5 seconds
    this.refreshInterval = setInterval(async () => {
      await this.discoverUsers();
    }, 5000);

    // Initial discovery
    this.discoverUsers();
  }

  /**
   * Discover active users on the network
   */
  async discoverUsers(): Promise<User[]> {
    try {
      const response = await fetch('/api/transfer');
      const data = await response.json();

      if (data.success && data.users) {
        data.users.forEach((user: User) => {
          this.users.set(user.id, {
            ...user,
            isOnline: true,
            lastSeen: new Date()
          });
        });
      }

      return Array.from(this.users.values());
    } catch (error) {
      console.error('Failed to discover users:', error);
      return Array.from(this.users.values());
    }
  }

  /**
   * Get all active users
   */
  getActiveUsers(): User[] {
    return Array.from(this.users.values()).filter(u => u.isOnline);
  }

  /**
   * Get a specific user by ID
   */
  getUserById(userId: number): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Send files to another user
   */
  async sendFiles(
    files: File[],
    targetUserId: number,
    senderUserId: number,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      let totalSize = 0;
      let uploadedSize = 0;

      files.forEach(file => {
        totalSize += file.size;
      });

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetUserId', targetUserId.toString());
        formData.append('senderUserId', senderUserId.toString());

        const response = await fetch('/api/transfer/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to send ${file.name}`);
        }

        uploadedSize += file.size;
        const progress = Math.round((uploadedSize / totalSize) * 100);
        onProgress?.(progress);

        console.log(`✓ Sent ${file.name} to User ${targetUserId}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send files:', error);
      return false;
    }
  }

  /**
   * Stop discovering users
   */
  stopDiscovery() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopDiscovery();
    this.users.clear();
  }
}

export const networkService = new NetworkService();
