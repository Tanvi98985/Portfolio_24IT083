import NodeCache from 'node-cache';

/**
 * Server-side In-Memory Cache instance
 * Configured with stdTTL = 60 seconds
 */
const cache = new NodeCache({
  stdTTL: 60,
});

/**
 * Simple in-memory cache hit/miss statistics counter
 */
export const cacheStats = {
  hits: 0,
  misses: 0,
};

export default cache;
