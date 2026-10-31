import { Component, createMemo, JSX, Match, Switch } from "solid-js";
import "./icon.scss";

export const parseEmoji = (code: string) => {
    const codePoint = parseInt(code, 16);
    if (Number.isNaN(codePoint)) return '📄';
    return String.fromCodePoint(codePoint);
};

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

type IconProps = SymbolProps | EmojiCodeProps | ImgProps;

const Icon: Component<IconProps> = (props) => {
    const style = createMemo<JSX.CSSProperties>(() => ({
        width: props.width ?? '16px',
        height: props.height ?? '16px',
        'font-size': props.fontSize ?? '16px',
        ...props.style,
    }));

    return (
        <span class="b3-list-item__graphic bookmark-plus-icon" style={style()}>
            <Switch>
                <Match when={props.symbol}>
                    <svg aria-hidden="true"><use href={`#${props.symbol}`} /></svg>
                </Match>
                <Match when={props.emojiCode}>
                    {parseEmoji(props.emojiCode)}
                </Match>
                <Match when={props.img}>
                    <img alt="" src={props.img} />
                </Match>
            </Switch>
        </span>
    );
};

export default Icon;
