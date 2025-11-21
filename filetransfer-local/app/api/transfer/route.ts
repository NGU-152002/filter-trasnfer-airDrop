import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Store active connections with their user info and last heartbeat
interface UserConnection {
  userId: number;
  userName: string;
  ipAddress: string;
  lastHeartbeat: number;
  connectedAt: number;
}

const activeConnections = new Map<string, UserConnection>();

// Clean up inactive users (not heard from in 6 seconds)
const INACTIVITY_TIMEOUT = 6000; // 6 seconds - aggressive cleanup

// Track server startup time
const SERVER_START_TIME = Date.now();
console.log('='.repeat(50));
console.log('✓ FILE TRANSFER SERVER STARTED');
console.log('✓ User registry initialized (empty)');
console.log('='.repeat(50));

function cleanupInactiveUsers() {
  const now = Date.now();
  const inactiveUsers: string[] = [];

  activeConnections.forEach((user, key) => {
    if (now - user.lastHeartbeat > INACTIVITY_TIMEOUT) {
      inactiveUsers.push(key);
      console.log(`User ${user.userName} (ID: ${user.userId}) disconnected (inactive)`);
    }
  });

  inactiveUsers.forEach(key => activeConnections.delete(key));
}

// DELETE: Clear all users (for testing/debugging)
export async function DELETE(request: NextRequest) {
  try {
    const count = activeConnections.size;
    activeConnections.clear();
    console.log(`🗑️  CLEARED ${count} users from registry`);

    return NextResponse.json({
      success: true,
      message: `Cleared ${count} users`,
      cleared: count
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear users' },
      { status: 500 }
    );
  }
}

// GET: Get all active users on the network
export async function GET(request: NextRequest) {
  try {
    // Clean up inactive users first
    cleanupInactiveUsers();

    const users = Array.from(activeConnections.values())
      .map(conn => ({
        id: conn.userId,
        userName: conn.userName,
        ipAddress: conn.ipAddress,
        connectedAt: conn.connectedAt
      }))
      .sort((a, b) => a.id - b.id); // Sort by user ID

    console.log(`Active users: ${users.length}`);
    users.forEach(u => console.log(`  - User ${u.id} (${u.userName})`));

    return NextResponse.json({
      success: true,
      users,
      totalUsers: users.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST: Register or update a user on the network
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, ipAddress } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or userName' },
        { status: 400 }
      );
    }

    const key = `user_${userId}`;
    const now = Date.now();
    const isNewUser = !activeConnections.has(key);

    // Register or update user
    activeConnections.set(key, {
      userId,
      userName,
      ipAddress: ipAddress || request.ip || 'unknown',
      lastHeartbeat: now,
      connectedAt: isNewUser ? now : activeConnections.get(key)!.connectedAt
    });

    if (isNewUser) {
      console.log(`✓ New user registered: ${userName} (ID: ${userId}) from ${ipAddress}`);
    } else {
      console.log(`✓ User heartbeat: ${userName} (ID: ${userId})`);
    }

    // Get current active users
    cleanupInactiveUsers();
    const activeUserCount = activeConnections.size;

    return NextResponse.json({
      success: true,
      message: isNewUser ? `User ${userName} registered` : `User ${userName} updated`,
      userId,
      isNewUser,
      activeUsers: activeUserCount
    });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
