import { Component, JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

export const parseEmoji = (code: string) => {
    let codePoint = parseInt(code, 16);
    if (Number.isNaN(codePoint)) return '📄';
    return String.fromCodePoint(codePoint);
}

interface CommonProps {
    fontSize?: string;
    height?: string;
    width?: string;
    style?: JSX.CSSProperties;
}

interface SymbolProps extends CommonProps {
    symbol: string;
    emojiCode?: never;
    img?: never;
}

interface EmojiCodeProps extends CommonProps {
    symbol?: never;
    emojiCode: string;
    img?: never;
}

interface ImgProps extends CommonProps {
    symbol?: never;
    emojiCode?: never;
    img: string;
}

type IProps = SymbolProps | EmojiCodeProps | ImgProps;


const Icon: Component<IProps> = (props) => {

    let style: JSX.CSSProperties = {
        "font-size": props?.fontSize ?? '14px',
        "height": props?.height,
        "width": props?.width,
    }

    if (props.style) {
        style = {...style, ...props.style};
    }

    const Symbol = () => (
        <svg class="b3-list-item__graphic" style={style}>
            <use href={`#${props.symbol}`}></use>
        </svg>
    );

    const Emoji = () => (
        <span class="b3-list-item__graphic" style={style}>
            {parseEmoji(props.emojiCode)}
        </span>
    );

    const Img = () => (
        <img alt="" class="emoji" src={props.img} title="" style={style}></img>
    );

    const createIcon = () => {
        if (props.symbol) return Symbol;
        else if (props.emojiCode) return Emoji;
        else if (props.img) return Img;
    }

    return (
        <Dynamic component={createIcon()} />
    );
};

export default Icon;
