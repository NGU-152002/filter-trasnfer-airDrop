import { useState, useCallback, useRef } from 'react';

interface TransferProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  targetUserId: number;
  targetUserName: string;
}

interface UseFileTransferReturn {
  isTransferring: boolean;
  transfers: TransferProgress[];
  sendFiles: (files: File[], targetUserId: number, targetUserName: string, userId: number) => Promise<void>;
  cancelTransfer: () => void;
}

export const useFileTransfer = (): UseFileTransferReturn => {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendFiles = useCallback(
    async (files: File[], targetUserId: number, targetUserName: string, userId: number) => {
      if (files.length === 0) return;

      setIsTransferring(true);
      abortControllerRef.current = new AbortController();

      const fileTransfers: TransferProgress[] = files.map(file => ({
        fileName: file.name,
        progress: 0,
        status: 'pending' as const,
        targetUserId,
        targetUserName
      }));

      setTransfers(fileTransfers);

      try {
        // Send each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('targetUserId', targetUserId.toString());
          formData.append('senderUserId', userId.toString());

          // Update status to uploading
          setTransfers(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'uploading' };
            return updated;
          });

          try {
            const response = await fetch('/api/transfer/upload', {
              method: 'POST',
              body: formData,
              signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            // Simulate upload progress
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += Math.random() * 40;
              if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
              }
              setTransfers(prev => {
                const updated = [...prev];
                updated[i] = { ...updated[i], progress: Math.min(progress, 100) };
                return updated;
              });
            }, 100);

            // Mark as completed
            setTransfers(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], status: 'completed', progress: 100 };
              return updated;
            });

            console.log(`✓ File sent: ${file.name} to ${targetUserName}`);
          } catch (error) {
            console.error(`✗ Failed to send ${file.name}:`, error);
            setTransfers(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], status: 'failed' };
              return updated;
            });
          }
        }
      } finally {
        setIsTransferring(false);

        // Clear transfers after 3 seconds
        setTimeout(() => {
          setTransfers([]);
        }, 3000);
      }
    },
    []
  );

  const cancelTransfer = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTransferring(false);
      setTransfers([]);
    }
  }, []);

  return {
    isTransferring,
    transfers,
    sendFiles,
    cancelTransfer
  };
};
