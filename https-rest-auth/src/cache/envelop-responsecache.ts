import { createRedisCache } from '@envelop/response-cache-redis'
import { Cache } from '@envelop/response-cache';
import { getRedisConnection } from '../utils/redis-connector';

let cache: Cache;

function initializeRedisCache() {
    const redis = getRedisConnection().connection;
    cache = createRedisCache({ redis });
}

function clearUserCache() {
    cache.invalidate([
        {
            typename: "User"
        },
        {
            typename: "PublicUser"
        }
    ])
}

function clearCache() {
    cache.invalidate([
        {
            typename: "User"
        },
        {
            typename: "PublicUser"
        },
        {
            typename: "ResourceCard"
        },
        {
            typename: "ResourceView"
        }
    ])
}

export { initializeRedisCache, clearCache, clearUserCache }
