import { useCallback, useEffect, useRef } from 'react';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Manages API request caching
 */
export const useApiCache = (key, fetchFunction) => {
  const getCachedData = () => {
    const cachedItem = apiCache.get(key);
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      return cachedItem.data;
    }
    return null;
  };

  const setCachedData = (data) => {
    apiCache.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  return { getCachedData, setCachedData };
};

/**
 * Non-blocking WhatsApp notifications
 */
export const sendNotificationAsync = async (notificationFunction, ...args) => {
  // Fire and forget - don't wait for response
  setTimeout(() => {
    notificationFunction(...args).catch(error => {
      console.error('Background notification error:', error);
    });
  }, 0);
};

/**
 * Debounce function to prevent excessive API calls
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Optimized database query handler
 */
export const useOptimizedQuery = (queryFunction) => {
  const execute = useCallback(async (...args) => {
    try {
      const cacheKey = JSON.stringify(args);
      const cached = apiCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const result = await queryFunction(...args);
      apiCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }, [queryFunction]);

  return execute;
};

/**
 * Background task scheduler
 */
export const scheduleBackgroundTask = (task, delay = 0) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => setTimeout(task, delay));
  } else {
    setTimeout(task, delay);
  }
};

/**
 * Memory cleanup utility
 */
export const useMemoryCleanup = () => {
  useEffect(() => {
    const cleanup = () => {
      // Clear old cache entries
      for (const [key, value] of apiCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_DURATION) {
          apiCache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);
};

/**
 * Optimized list rendering
 */
export const useVirtualList = (items, itemHeight) => {
  const containerRef = useRef(null);
  const [visibleItems, setVisibleItems] = useState([]);

  const updateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    setVisibleItems(items.slice(startIndex, endIndex + 1));
  }, [items, itemHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', updateVisibleItems);
    window.addEventListener('resize', updateVisibleItems);

    updateVisibleItems();

    return () => {
      container.removeEventListener('scroll', updateVisibleItems);
      window.removeEventListener('resize', updateVisibleItems);
    };
  }, [updateVisibleItems]);

  return { containerRef, visibleItems };
};

// Usage examples:
/*
// In ScooterDetails.jsx:

import { 
  sendNotificationAsync, 
  useApiCache, 
  useDebounce,
  useMemoryCleanup
} from '../lib/performance';

// For WhatsApp notifications
const handleAddService = async (e) => {
  e.preventDefault();
  try {
    // Save to database first
    await saveServiceToDatabase();
    
    // Send notification in background without waiting
    sendNotificationAsync(sendServiceNotification, {
      date: formatWhatsAppDate(newService.service_date),
      scooterId: scooter.id,
      currentKm: currentKm,
      nextKm: nextKm,
      category: scooter.category?.name
    });

    // Continue with UI updates immediately
    setShowAddModal(false);
    fetchScooterDetails();
  } catch (error) {
    console.error('Error:', error);
  }
};

// For API caching
const fetchScooterDetails = useCallback(async () => {
  const { getCachedData, setCachedData } = useApiCache(
    `scooter-${id}`,
    async () => {
      const data = await supabase.from('scooters')...;
      return data;
    }
  );

  const cachedData = getCachedData();
  if (cachedData) {
    setScooter(cachedData);
    return;
  }

  const data = await fetchFromDatabase();
  setCachedData(data);
  setScooter(data);
}, [id]);
*/