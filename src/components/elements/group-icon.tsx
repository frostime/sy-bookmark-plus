import { Match, Switch } from "solid-js";
import Icon from "./icon";

export const GroupIcon = (props: {
    group: Pick<IBookmarkGroup, 'type' | 'icon'>;
}) => {
    return (
        <Switch fallback={<Icon symbol={(!props.group.type || props.group.type === 'normal') ? 'iconFolder' : 'iconSearch'} />}>
            <Match when={props.group.icon?.type === 'symbol'}>
                <Icon symbol={props.group.icon.value} />
            </Match>
            <Match when={props.group.icon?.type === 'emoji'}>
                <Icon emojiCode={props.group.icon.value} />
            </Match>
            <Match when={props.group.icon?.type === 'img'}>
                <Icon img={props.group.icon.value} width="14px" height="14px" />
            </Match>
        </Switch>
    );
}