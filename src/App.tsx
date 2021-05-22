import { useState } from 'react';
import YouTube from 'react-youtube';
import './App.css';
import { getPlaylistVideoIds, getVideos, PlaylistSearchItem, PlaylistSearchItems, searchPlaylists, VideoItem, videoItemToPlayerItem, VideoPlayerItem } from './utils';
import { Input, Label, Loader, Message} from 'semantic-ui-react';

import { SearchResults } from './components/SearchResults';

function App() {
  const MAX_RESULTS: number = 5;
  const [query, setQuery] = useState('');
  const [validPlaylists, setValidPlaylists] = useState<PlaylistSearchItem[]>([]);
  const [videoPlayerItems, setVideoPlayerItems] = useState<VideoPlayerItem[]>([]);
  const [videoIndex, setVideoIndex] = useState<number>(0);
  const [showDrinkText, setShowDrinkText] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const hidden: string = hideHeader ? ' hidden' : ''
  

  const searchValidPlaylists = async (evt:any) => {
    evt.preventDefault();
    setError('');
    setVideoIndex(0);
    setVideoPlayerItems([]);
    setValidPlaylists([]);
    setIsLoading(true);
    const playlists: PlaylistSearchItems = await searchPlaylists(query);
    const validPlaylists: PlaylistSearchItem[] = [];
    for (let item of playlists.items) {
      const videoIds: string[] = await getPlaylistVideoIds(item.id.playlistId);
      if (videoIds.length < 60) {
        continue;
      }
      const videos: VideoItem[] = await getVideos(videoIds);
      if (videos.length >= 60) {
        validPlaylists.push({...item, videos: videos.map(videoItemToPlayerItem)});
      }
      if (validPlaylists.length >= MAX_RESULTS) {
        break;
      }
    }
    console.log('validPlaylists: ', validPlaylists);
    setValidPlaylists(validPlaylists);
    setIsLoading(false);
  }

  const getPlaylistIdFromUrl = (url: string) => {
    const paramsStartIndex: number = url.indexOf('?');
    if (paramsStartIndex === -1) {
      console.log('invalid playlist url');
      return '';
    }
    const queryParams: string = url.substring(paramsStartIndex, url.length);
    const allParams: string[] = queryParams.split('&');
    const playlistIdParams: string[] = allParams.filter((param:string) => param.includes('list'));
    if (!playlistIdParams.length) {
      console.log('invalid playlist url');
      return '';
    }
    return playlistIdParams[0].split('=')[1];
  }

  const onReady = (evt) => {
    evt.target.cueVideoById(videoPlayerItems[videoIndex]);
    setHideHeader(true);
    setVideoIndex(videoIndex + 1);
  }

  const displayDrinkText = () => {
    setShowDrinkText(true);
    setTimeout(() => setShowDrinkText(false), 2000);
  }

  const onPlayerStateChange = (evt) => {
    if (videoIndex < 60) {
      displayDrinkText();
      evt.target.seekTo(0);
      evt.target.loadVideoById(videoPlayerItems[videoIndex]);
      setVideoIndex(videoIndex + 1);
    }
  }


  const getVideoPlayer = (): JSX.Element | null => {
    if (error) {
      return <Message compact error content={error}  />
    }
    if (isLoading) {
      return <Loader active />;
    }
    return videoPlayerItems.length === 0
      ? null
      : <YouTube 
          onReady={onReady}
          onEnd={onPlayerStateChange}
          onError={onPlayerStateChange}
          onPause={() => setHideHeader(false)}
          onPlay={() => setHideHeader(true)}
          containerClassName="youtube-container"
          className={showDrinkText ? 'hidden' : ''}
          opts={{playerVars: {controls: 0, showinfo: 0, rel: 0, modestbranding: 1}, width: '100%', height: '100%'}}
        />
  }

  return (
    <div className="App">
      {videoIndex > 0 && 
      <Label 
        className="playlist-meta" 
        content={`Video ${videoIndex} / 60`} 
      />}
      <div className={`heading${hidden}`}>
        <div 
          className="playlist-form"
        >
          <div className="form-header">
            <Label 
              icon="beer" 
              size="big" 
              content="YouTube Power Hour" 
            />
          </div>
          <Input type="text"
            value={query}
            onChange={e => setQuery(e.target.value)} 
            action={{
              color: 'teal',
              labelPosition: 'right',
              icon: 'youtube',
              content: 'Search Power Hour(s)',
              onClick: searchValidPlaylists
            }}
          />
        </div>
      </div>
      {showDrinkText 
      && (<div className="drink-text">
            <div>Drink!</div>
          </div>)}
      {!videoPlayerItems.length 
        && <SearchResults setPlaylist={setVideoPlayerItems} results={validPlaylists} />}
      {getVideoPlayer()}
    </div>
  );
}

export default App;
