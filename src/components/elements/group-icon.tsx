import { Match, Switch } from "solid-js";
import Icon from "./icon";

export const GroupIcon = (props: {
    group: Pick<IBookmarkGroup, 'type' | 'icon'>;
    size?: string;
    defaultSymbol?: string;
}) => {
    const size = () => props.size ?? '16px';
    return (
        <Switch fallback={<Icon symbol={props.defaultSymbol ?? ((!props.group.type || props.group.type === 'normal') ? 'iconFolder' : 'iconSearch')} width={size()} height={size()} fontSize={size()} />}>
            <Match when={props.group.icon?.type === 'symbol'}>
                <Icon symbol={props.group.icon.value} width={size()} height={size()} fontSize={size()} />
            </Match>
            <Match when={props.group.icon?.type === 'emoji'}>
                <Icon emojiCode={props.group.icon.value} width={size()} height={size()} fontSize={size()} />
            </Match>
            <Match when={props.group.icon?.type === 'img'}>
                <Icon img={props.group.icon.value} width={size()} height={size()} />
            </Match>
        </Switch>
    );
}