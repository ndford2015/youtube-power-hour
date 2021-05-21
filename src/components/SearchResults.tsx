import { PlaylistSearchItem } from "../utils";
import { SearchResult } from "./SearchResult";
import './components.css';
export function SearchResults(props: SearchResultsProps) {
    return (
        <div className="search-results">
            {props.results.map(result => <SearchResult title={result.snippet.title} thumbnail={result.snippet.thumbnails.default}/>)}
        </div>
    );
}

export interface SearchResultsProps {
    readonly results: PlaylistSearchItem[];
}