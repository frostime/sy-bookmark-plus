import { createSignal, For, Show } from "solid-js";
import Icon from "./icon";
import { inject } from "@/libs/inject";

type ImojiGroup = {
    id: string;
    items: {
        unicode: string;
    }[]
}

interface IProps {
    choose: (args: { type: 'symbol' | 'emoji' | ''; value: string }) => void;
}

const SelectIcons = (props: IProps) => {
    const [activeTab, setActiveTab] = createSignal<'symbols' | 'emojis'>('symbols');
    const symbols = Array.from(document.querySelectorAll('symbol'));

    const i18n = inject<I18n>('i18n');

    const ALLOWED_EMOJI_GROUP = ['object', 'symbols', 'flags', 'nature', 'people', 'activity', 'travel'];
    const EmojisGroups = (window.siyuan.emojis as ImojiGroup[]).filter(emoji => ALLOWED_EMOJI_GROUP.includes(emoji.id))
        .sort((a, b) => ALLOWED_EMOJI_GROUP.indexOf(a.id) - ALLOWED_EMOJI_GROUP.indexOf(b.id));
    const emojiUnicodes = EmojisGroups.map(group => group.items.map(item => item.unicode)).flat();

    const SIZE = '20px'

    const AllSymbols = () => (
        <div class="icons">
            <For each={symbols}>
                {(symbol) => (
                    <div style={{ display: 'inline-block', cursor: 'pointer', margin: '5px' }}
                        onClick={() => props.choose({ type: 'symbol', value: symbol.id })}>
                        <Icon symbol={symbol.id} width={SIZE} height={SIZE} />
                    </div>
                )}
            </For>
        </div>
    );

    const EmojiIcons = () => (
        <div class="icons">
            <For each={emojiUnicodes}>
                {(unicode) => (
                    <div style={{ display: 'inline-block', cursor: 'pointer', margin: '5px' }}
                        onClick={() => props.choose({ type: 'emoji', value: unicode })}>
                        <Icon emojiCode={unicode} width={SIZE} height={SIZE} fontSize={SIZE} />
                    </div>
                )}
            </For>
        </div>
    );

    return (
        <div style={{ margin: '10px 24px' }}>
            <div style={{ display: 'flex', 'align-items': 'center', gap: '15px' }}>
                <h3>{i18n.selecticon.h3}</h3>
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <button class="b3-button" onClick={() => setActiveTab('symbols')}>Symbols</button>
                    <button class="b3-button" onClick={() => setActiveTab('emojis')}>Emojis</button>
                </div>
                <button class="b3-button" onClick={() => props.choose({ type: '', value: '' })}>{i18n.selecticon.reset}</button>
            </div>

            <br />

            <Show when={activeTab() === 'symbols'}>
                <AllSymbols />
            </Show>
            <Show when={activeTab() === 'emojis'}>
                <EmojiIcons />
            </Show>
        </div>
    );
}

export default SelectIcons;