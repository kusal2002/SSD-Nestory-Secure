import { useCallback, useEffect, useRef, useState } from 'react';

interface ReadingProgressData {
  storyId: string;
  childId: string;
  startTime: number;
  currentPage?: number;
  totalPages?: number;
  timeSpentSeconds: number;
  isReading: boolean;
}

/**
 * Hook for tracking reading progress and time spent
 * 
 * Features:
 * - Tracks reading session start/end times
 * - Measures time spent (pauses when tab loses focus)
 * - Tracks current page and total pages
 * - Provides data ready for analytics/progress endpoints
 * 
 * Usage:
 * const { startReading, endReading, updateProgress, getProgressData } = useReadingProgress(storyId, childId, totalPages);
 * 
 * // Start tracking when reader loads
 * useEffect(() => {
 *   startReading();
 *   return () => endReading();
 * }, []);
 * 
 * // Update as user scrolls/navigates pages
 * const handlePageChange = (pageNum) => {
 *   updateProgress(pageNum);
 * }
 * 
 * // Send to backend when user exits
 * const handleExit = () => {
 *   const progressData = getProgressData();
 *   await ReadingService.logSession(progressData);
 * }
 */
export const useReadingProgress = (
  storyId: string | undefined,
  childId: string | undefined,
  totalPages?: number
) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  // Start reading session
  const startReading = useCallback(() => {
    if (!storyId || !childId) return;
    
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    setTimeSpent(0);
    setIsReading(true);

    // Timer to accumulate reading time
    timerRef.current = setInterval(() => {
      accumulatedTimeRef.current += 1;
      setTimeSpent(accumulatedTimeRef.current);
    }, 1000);
  }, [storyId, childId]);

  // End reading session
  const endReading = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsReading(false);
  }, []);

  // Update current page
  const updateProgress = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  // Get progress data ready for API submission
  const getProgressData = useCallback((): ReadingProgressData => {
    return {
      storyId: storyId || '',
      childId: childId || '',
      startTime: startTimeRef.current,
      currentPage,
      totalPages,
      timeSpentSeconds: accumulatedTimeRef.current,
      isReading,
    };
  }, [storyId, childId, currentPage, totalPages, isReading]);

  // Handle visibility changes (pause when tab loses focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        endReading();
      } else if (isReading) {
        startReading();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isReading, startReading, endReading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    startReading,
    endReading,
    updateProgress,
    getProgressData,
    timeSpent,
    isReading,
    currentPage,
  };
};
