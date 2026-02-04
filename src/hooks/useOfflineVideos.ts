import { useState, useEffect, useCallback } from 'react';

const DB_NAME = "FunPlayOfflineVideos";
const STORE_NAME = "videos";
const DB_VERSION = 1;

export interface OfflineVideo {
  id: string;
  title: string;
  thumbnail?: string;
  blob: Blob;
  downloadedAt: string;
  size: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const useOfflineVideos = () => {
  const [videos, setVideos] = useState<OfflineVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allVideos = request.result as OfflineVideo[];
        setVideos(allVideos);
        
        // Calculate total storage used
        const totalSize = allVideos.reduce((acc, video) => acc + (video.size || 0), 0);
        setStorageUsed(totalSize);
        setLoading(false);
      };

      request.onerror = () => {
        console.error('Error fetching offline videos:', request.error);
        setLoading(false);
      };
    } catch (error) {
      console.error('Error opening IndexedDB:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const getCount = useCallback(async (): Promise<number> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }, []);

  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          fetchVideos(); // Refresh the list
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }, [fetchVideos]);

  const createBlobUrl = useCallback((blob: Blob): string => {
    return URL.createObjectURL(blob);
  }, []);

  const formatStorageSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  return {
    videos,
    loading,
    storageUsed,
    getCount,
    deleteVideo,
    createBlobUrl,
    formatStorageSize,
    refetch: fetchVideos,
  };
};
