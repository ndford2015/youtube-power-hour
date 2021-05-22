import { API_KEY, YOUTUBE_API_BASE_URL } from "./constants";
import {parse, toSeconds} from 'iso8601-duration';

export enum API_ENDPOINT {
  SEARCH = 'search',
  PLAYLIST_ITEMS = 'playlistItems',
  VIDEOS = 'videos'
}

export async function getResource(endpoint: API_ENDPOINT, params: QUERY_PARAMS): Promise<Response> {
  const url: string = `${YOUTUBE_API_BASE_URL}${endpoint}?${paramsToQueryString(params)}&key=${API_KEY}`;
  return fetch(url);
}

export async function searchPlaylists(query: string) {
  const params: SearchQueryParams = {
    part: 'snippet',
    type: 'playlist',
    q: query,
    maxResults: 50,
    fields: 'items(id/playlistId,snippet(title,thumbnails/default, description))'
  }
  const response = await getResource(API_ENDPOINT.SEARCH, params);
  return await response.json();
}

export async function getPlaylistVideoIds(playlistId: string) {
  const params: PlaylistItemQueryParams = {
    playlistId,
    part: 'contentDetails',
    maxResults: 50,
    fields: 'nextPageToken,items/contentDetails/videoId'
  }
  const videoIds: string[] = [];
  let response: Response;
  let playlist: PlaylistItemResponse;
  let pageToken: string = '';
  while (pageToken !== undefined) {
    response = await getResource(API_ENDPOINT.PLAYLIST_ITEMS, {
      ...params, pageToken});
    playlist = await response.json();
    playlist.items.forEach((item: PlaylistItem) => {
      videoIds.push(item.contentDetails.videoId);
    });
    pageToken = playlist.nextPageToken;
  }
  return shuffleArray(videoIds);
}

export function getDurationSeconds(isoDuration: string) {
  return toSeconds(parse(isoDuration));
}

export async function getVideos(ids: string[]): Promise<VideoItem[]> {
  let videos: VideoItem[] = [];
  for (let i: number = 0; i < ids.length; i+=50) {
    const params: VideoQueryParams = {
      part: 'contentDetails',
      maxResults: 50,
      id: ids.slice(i, i + 50).join(',')
    }
    const response: Response = await getResource(API_ENDPOINT.VIDEOS, params);
    const videoResponse: VideosResponse = await response.json();
    videos = videos.concat(videoResponse
      .items
      .filter(item => !isContentRestricted(item) 
        && isUSAllowed(item)
        && (getDurationSeconds(item.contentDetails.duration) > 60)));
    if (videos.length >= 60) {
      return shuffleArray(videos);
    }
  }
  return shuffleArray(videos);
}

export function isContentRestricted(item: VideoItem): boolean {
  return item.contentDetails.contentRating.ytRating !== undefined;
}

export function isUSAllowed(item: VideoItem): boolean {
  const { regionRestriction } = item.contentDetails
  if (regionRestriction === undefined) {
    return true;
  }
  if (regionRestriction.blocked !== undefined && regionRestriction.blocked.includes("US")) {
    return false;
  }
  if (regionRestriction.allowed !== undefined && !regionRestriction.allowed.includes("US")) {
    return false;
  }
  return true;
}

export function videoItemToPlayerItem(videoItem: VideoItem): VideoPlayerItem {
  const {id, contentDetails } = videoItem;
  const startSeconds: number = getStartTime(getDurationSeconds(contentDetails.duration));
  return {
    videoId: id,
    startSeconds,
    endSeconds: startSeconds + 60
  }
}

function getStartTime(duration: number): number {
  return Math.floor(Math.random() * Math.floor(duration - 60));
}

export function paramsToQueryString(params: any):string {
  return Object.keys(params)
      .map((key: any) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
}

function shuffleArray(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export interface CommonQueryParams {
  readonly part: string;
  readonly maxResults: number;
  readonly fields?: string;
}

export interface SearchQueryParams extends CommonQueryParams {
  readonly q: string;
  readonly type: string;
}

export interface PlaylistItemQueryParams extends CommonQueryParams {
  readonly playlistId: string;
  readonly pageToken?: string;
}

export interface VideoQueryParams extends CommonQueryParams {
  // comma delimited string of ids
  readonly id: string;
}

export interface PlaylistItemResponse {
  readonly items: PlaylistItem[];
  readonly nextPageToken: string;
}

export interface PlaylistItem {
  readonly contentDetails: {videoId: string};
}

export interface VideoItem {
  readonly id: string,
  readonly contentDetails: { 
    duration: string, 
    contentRating: {ytRating?: string},
    regionRestriction?: {allowed?: string[], blocked?: string[]}  
  }
}

export interface VideoPlayerItem {
  readonly videoId: string,
  readonly startSeconds: number,
  readonly endSeconds: number
}

export interface VideosResponse {
  readonly items: VideoItem[];
}

export interface PlaylistSearchItems {
  readonly items: PlaylistSearchItem[];
}

export interface PlaylistSearchItem {
  readonly id: {
    playlistId: string
  };
  readonly videos?: VideoPlayerItem[];
  readonly snippet: {
    readonly title: string;
    readonly description: string;
    readonly thumbnails: {
      default: Thumbnail;
    }
  }
}

export interface Thumbnail {
  readonly height: number;
  readonly width: number;
  readonly url: string;
}

export type QUERY_PARAMS = Partial<SearchQueryParams & PlaylistItemQueryParams>;