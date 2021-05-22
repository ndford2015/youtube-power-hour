import { PlaylistSearchItem, VideoPlayerItem } from "../utils";
import { SearchResult } from "./SearchResult";
import './components.css';
export function SearchResults(props: SearchResultsProps) {
    return (
        <div className="search-results">
            {props.results.map(result => (
                <SearchResult 
                    title={result.snippet.title} 
                    description={result.snippet.description} 
                    thumbnail={result.snippet.thumbnails.default}
                    onClick={() => props.setPlaylist(result.videos ?? [])}
                />))}
        </div>
    );
}

export interface SearchResultsProps {
    readonly results: PlaylistSearchItem[];
    readonly setPlaylist: (videos: VideoPlayerItem[]) => void;
}