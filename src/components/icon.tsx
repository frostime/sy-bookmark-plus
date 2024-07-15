import { Component } from "solid-js";
import { Dynamic } from "solid-js/web";

export const parseEmoji = (code: string) => {
    let codePoint = parseInt(code, 16);
    if (Number.isNaN(codePoint)) return '📄';
    return String.fromCodePoint(codePoint);
}

interface CommonProps {
    fontSize?: string;
    height?: string;
    weight?: string;
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

    const Symbol = () => (
        <svg class="b3-list-item__graphic" style="width: 100%; height: 100%;">
            <use href="#iconFolder"></use>
        </svg>
    );

    const Emoji = () => (
        <span class="b3-list-item__graphic" style="width: 100%; height: 100%;">
            {parseEmoji(props.emojiCode)}
        </span>
    );

    const Img = () => (
        <img alt="" class="emoji" src={props.img} title="" style="width: 100%; height: 100%;"></img>
    );

    const createIcon = () => {
        if (props.symbol) return Symbol;
        else if (props.emojiCode) return Emoji;
        else if (props.img) return Img;
    }

    const style = {
        "font-size": props?.fontSize ?? '14px',
        "height": props?.height,
        "weight": props?.weight,
    }

    return (
        <span style={style}>
            <Dynamic component={createIcon()} />
        </span>
    );
};

export default Icon;
