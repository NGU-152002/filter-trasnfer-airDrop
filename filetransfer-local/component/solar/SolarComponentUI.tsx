'use client';

import { useState, useEffect, useRef } from 'react';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { useConnectedUsers, type ConnectedUser } from '@/hooks/useConnectedUsers';

export default function SolarComponentUi() {
  const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null);
  const [dialogPos, setDialogPos] = useState({ x: 0, y: 0 });
  const [selectedPlanetForTransfer, setSelectedPlanetForTransfer] = useState<number | null>(null);
  const [userId, setUserId] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const planetRefsMap = useRef<Map<number, HTMLElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use dynamic users from network
  const { users: connectedUsers, isLoading: isLoadingUsers, error: usersError, getUserCount } = useConnectedUsers();
  const { isTransferring, transfers, sendFiles, cancelTransfer } = useFileTransfer();

  // Initialize current user on mount
  useEffect(() => {
    const registerUser = async () => {
      try {
        const userIdFromStorage = localStorage.getItem('fileTransferUserId');
        let userIdToUse = userIdFromStorage ? parseInt(userIdFromStorage) : Math.floor(Math.random() * 100) + 1;

        setUserId(userIdToUse);

        const response = await fetch('/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userIdToUse,
            userName: `User ${userIdToUse}`,
            ipAddress: window.location.hostname
          })
        });

        if (response.ok) {
          localStorage.setItem('fileTransferUserId', userIdToUse.toString());
          console.log(`✓ Registered as User ${userIdToUse} on the network`);
        }
      } catch (error) {
        console.error('Failed to register user:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    registerUser();
  }, []);

  // Update dialog position while hovering
  useEffect(() => {
    if (hoveredPlanet === null) return;

    const updatePosition = () => {
      const element = planetRefsMap.current.get(hoveredPlanet);
      if (element) {
        const rect = element.getBoundingClientRect();
        setDialogPos({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    };

    const animationFrame = setInterval(updatePosition, 16);
    return () => clearInterval(animationFrame);
  }, [hoveredPlanet]);

  const handlePlanetHover = (e: React.MouseEvent, planetId: number) => {
    e.stopPropagation();
    const element = e.currentTarget as HTMLElement;
    planetRefsMap.current.set(planetId, element);
    const rect = element.getBoundingClientRect();
    setHoveredPlanet(planetId);
    setDialogPos({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleSunHover = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredPlanet(0);
    setDialogPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHoveredPlanet(null);
  };

  const handlePlanetClick = (planetId: number, planetName: string) => {
    if (planetId === userId) {
      alert('Cannot send files to yourself!');
      return;
    }
    setSelectedPlanetForTransfer(planetId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && selectedPlanetForTransfer && isInitialized) {
      const filesArray = Array.from(files);
      const targetPlanet = connectedUsers.find(p => p.id === selectedPlanetForTransfer);

      console.log(`Initiating transfer of ${filesArray.length} file(s) to ${targetPlanet?.name}`);

      await sendFiles(filesArray, selectedPlanetForTransfer, targetPlanet?.name || '', userId);

      setSelectedPlanetForTransfer(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Initializing file transfer system...</p>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-red-400 text-xl">Error: {usersError}</p>
      </div>
    );
  }

  // Filter out current user from display
  // Also filter out users with same ID (shouldn't exist but safety check)
  const otherUsers = connectedUsers.filter(u => u.id !== userId && u.id !== 0);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .orbit-container {
          animation: orbit linear infinite;
        }
      `}</style>

      {/* Solar System Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun (Current User) */}
        <div className="absolute z-10">
          <div
            className="w-20 h-20 rounded-full bg-yellow-300 shadow-lg shadow-yellow-500 flex items-center justify-center text-center text-black text-xs font-bold cursor-pointer transition-transform hover:scale-110"
            title={`You (User ${userId})`}
            onMouseEnter={handleSunHover}
            onMouseLeave={handleMouseLeave}
          >
            <div>
              <div>You</div>
              <div className="text-xs font-normal">(User {userId})</div>
            </div>
          </div>
        </div>

        {/* Dynamic Planet Orbits */}
        {otherUsers.length > 0 ? (
          otherUsers.map((planet, index) => (
            <div key={planet.id} style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
              {/* Orbit Path (White Line) */}
              <svg
                className="absolute"
                width={planet.distance * 2}
                height={planet.distance * 2}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              >
                <circle
                  cx={planet.distance}
                  cy={planet.distance}
                  r={planet.distance}
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                  opacity="0.3"
                />
              </svg>

              {/* Rotating Planet Container */}
              <div
                className="orbit-container absolute"
                style={{
                  width: planet.distance * 2,
                  height: planet.distance * 2,
                  left: '50%',
                  top: '50%',
                  marginLeft: -planet.distance,
                  marginTop: -planet.distance,
                  zIndex: 10 + index,
                  animationDuration: `${planet.speed}s`,
                }}
              >
                {/* Planet */}
                <div
                  ref={(el) => {
                    if (el) {
                      planetRefsMap.current.set(planet.id, el);
                    }
                  }}
                  className={`absolute ${planet.color} rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center`}
                  style={{
                    width: `${planet.size}px`,
                    height: `${planet.size}px`,
                    top: 0,
                    left: planet.distance,
                    marginLeft: -(planet.size / 2),
                    marginTop: -(planet.size / 2),
                    pointerEvents: 'auto',
                  }}
                  onMouseEnter={(e) => handlePlanetHover(e, planet.id)}
                  onMouseLeave={(e) => handleMouseLeave(e)}
                  onClick={(e)=>{
                    e.stopPropagation();
                    handlePlanetClick(planet.id, planet.name);
                  }}
                  title={planet.name}
                >
                  <span className="text-white text-xs font-bold text-center px-1 pointer-events-none" style={{ fontSize: `${Math.max(8, planet.size / 4)}px` }}>
                    {planet.id}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="absolute text-white text-center">
            <p>No other users connected</p>
            <p className="text-xs text-gray-400 mt-2">Waiting for users to join...</p>
          </div>
        )}

        {/* Hover Dialog Box */}
        {hoveredPlanet !== null && (
          <div
            className="fixed bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm border border-gray-700 pointer-events-none z-50 whitespace-nowrap"
            style={{
              left: `${dialogPos.x}px`,
              top: `${dialogPos.y}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px',
            }}
          >
            {hoveredPlanet === 0
              ? `You (User ${userId}) - Active`
              : `${connectedUsers.find((p) => p.id === hoveredPlanet)?.name || 'User'} - Click to send files 📁`}
          </div>
        )}

        {/* Top Left Info Panel */}
        <div className="absolute top-8 left-8">
          <p className="text-sm text-white font-semibold">Solar File Transfer</p>
          <p className="text-xs text-gray-400 mt-1">Your ID: User {userId}</p>
          <p className="text-xs text-green-400 mt-1">
            Connected: {otherUsers.length} {otherUsers.length === 1 ? 'user' : 'users'}
          </p>
          <p className="text-xs text-yellow-400 mt-1">
            Total received: {connectedUsers.length} (includes you)
          </p>
        </div>

        {/* Transfer Status Panel */}
        {(isTransferring || transfers.length > 0) && (
          <div className="absolute bottom-8 left-8 right-8 bg-gray-900 text-white p-4 rounded-lg border border-gray-700 max-h-48 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold">File Transfers</p>
              {isTransferring && (
                <button
                  onClick={cancelTransfer}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="space-y-2">
              {transfers.map((transfer, idx) => (
                <div key={idx} className="text-xs border-t border-gray-700 pt-2">
                  <div className="flex justify-between mb-1">
                    <span className="truncate max-w-xs">{transfer.fileName}</span>
                    <span className={`text-xs font-semibold ${
                      transfer.status === 'completed' ? 'text-green-400' :
                      transfer.status === 'failed' ? 'text-red-400' :
                      'text-blue-400'
                    }`}>
                      {transfer.status === 'completed' ? '✓' : transfer.status === 'failed' ? '✗' : '⟳'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded h-1.5">
                    <div
                      className={`h-1.5 rounded transition-all ${
                        transfer.status === 'completed' ? 'bg-green-500' :
                        transfer.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${transfer.progress}%` }}
                    />
                  </div>
                  <p className="text-gray-400 mt-1">→ {transfer.targetUserName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingUsers && connectedUsers.length === 0 && (
          <div className="absolute bottom-8 left-8 text-yellow-400 text-sm">
            Discovering users on network...
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
