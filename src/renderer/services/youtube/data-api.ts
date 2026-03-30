import {
  YouTubeSearchParams,
  YouTubeSearchResponse,
  YouTubeSearchResult,
  YTSearchListResponse,
  YTVideoListResponse,
} from './types';
import { YOUTUBE_MUSIC_TOPIC_ID, DEFAULT_SEARCH_RESULTS } from '@shared/constants';
import { parseIsoDuration } from '@shared/utils';
import { useSettingsStore } from '../../stores/settings-store';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  // Settings store key takes priority over env var
  const storeKey = useSettingsStore.getState().youtubeApiKey;
  if (storeKey) return storeKey;

  const envKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (envKey && envKey !== 'YOUR_API_KEY_HERE') return envKey;

  throw new Error(
    'YouTube API key not configured. Add your key in Settings.'
  );
}

/**
 * Search YouTube for music videos
 */
export async function searchYouTube(
  params: YouTubeSearchParams
): Promise<YouTubeSearchResponse> {
  const apiKey = getApiKey();
  const settings = useSettingsStore.getState();
  const maxResults = params.maxResults || settings.searchResultsCount || DEFAULT_SEARCH_RESULTS;

  // Step 1: Search for videos
  const searchUrl = new URL(`${API_BASE}/search`);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('q', params.query);
  searchUrl.searchParams.set('maxResults', String(maxResults));
  if (settings.musicOnly) {
    searchUrl.searchParams.set('videoCategoryId', '10'); // Music category
  }
  searchUrl.searchParams.set('key', apiKey);

  console.log('[YT Search] URL:', searchUrl.toString().replace(apiKey, 'KEY_HIDDEN'));

  if (params.pageToken) {
    searchUrl.searchParams.set('pageToken', params.pageToken);
  }
  if (params.order) {
    searchUrl.searchParams.set('order', params.order);
  }
  if (params.videoDuration && params.videoDuration !== 'any') {
    searchUrl.searchParams.set('videoDuration', params.videoDuration);
  }

  const searchRes = await fetch(searchUrl.toString());
  console.log('[YT Search] Response status:', searchRes.status);
  if (!searchRes.ok) {
    const err = await searchRes.json();
    console.error('[YT Search] Error response:', err);
    throw new Error(
      `YouTube search failed: ${err.error?.message || searchRes.statusText}`
    );
  }

  const searchData: YTSearchListResponse = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) {
    return { results: [], totalResults: 0 };
  }

  // Step 2: Get video details (duration) — costs 1 quota unit vs 100 for search
  const videoIds = searchData.items.map((item) => item.id.videoId).join(',');
  const detailsUrl = new URL(`${API_BASE}/videos`);
  detailsUrl.searchParams.set('part', 'contentDetails,snippet');
  detailsUrl.searchParams.set('id', videoIds);
  detailsUrl.searchParams.set('key', apiKey);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) {
    // If details fail, return search results without duration
    return mapSearchResults(searchData, new Map());
  }

  const detailsData: YTVideoListResponse = await detailsRes.json();

  // Build duration map
  const durationMap = new Map<string, number>();
  for (const video of detailsData.items) {
    durationMap.set(video.id, parseIsoDuration(video.contentDetails.duration));
  }

  return mapSearchResults(searchData, durationMap);
}

function mapSearchResults(
  searchData: YTSearchListResponse,
  durationMap: Map<string, number>
): YouTubeSearchResponse {
  const results: YouTubeSearchResult[] = searchData.items.map((item) => ({
    videoId: item.id.videoId,
    title: decodeHtmlEntities(item.snippet.title),
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default.url,
    duration: durationMap.get(item.id.videoId) || 0,
    publishedAt: item.snippet.publishedAt,
  }));

  return {
    results,
    nextPageToken: searchData.nextPageToken,
    totalResults: searchData.pageInfo.totalResults,
  };
}

/**
 * Get video details by ID (uses 1 quota unit)
 */
export async function getVideoDetails(
  videoId: string
): Promise<YouTubeSearchResult | null> {
  const apiKey = getApiKey();

  const url = new URL(`${API_BASE}/videos`);
  url.searchParams.set('part', 'contentDetails,snippet');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data: YTVideoListResponse = await res.json();
  if (!data.items || data.items.length === 0) return null;

  const video = data.items[0];
  return {
    videoId: video.id,
    title: decodeHtmlEntities(video.snippet.title),
    channelTitle: video.snippet.channelTitle,
    thumbnailUrl:
      video.snippet.thumbnails.high?.url ||
      video.snippet.thumbnails.medium?.url ||
      video.snippet.thumbnails.default.url,
    duration: parseIsoDuration(video.contentDetails.duration),
    publishedAt: video.snippet.publishedAt,
  };
}

/**
 * Decode HTML entities that YouTube API returns in titles
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
