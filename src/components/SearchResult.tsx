import { Icon } from "semantic-ui-react";
import { Thumbnail } from "../utils";

export function SearchResult(props: SearchResultProps) {
    return (
        <div onClick={props.onClick} className="search-result">
            <div className="search-result-header">{props.title}</div>
            <Icon name="play circle outline" />
            <div className="search-result-details">
                <img 
                    src={props.thumbnail.url} 
                    height={props.thumbnail.height * 2} 
                    width={props.thumbnail.width * 2}
                />
                <span>{props.description}</span>
            </div>
        </div>
    )
}

export interface SearchResultProps {
    readonly title: string;
    readonly thumbnail: Thumbnail;
    readonly description: string;
    readonly onClick: () => void;
}


