import { createSignal, For, Show } from "solid-js";
import Icon from "./icon";
// import { inject } from "@/libs/inject";
import { solidDialog } from "@/libs/dialog";

import { i18n } from "@/utils/i18n";

type ImojiGroup = {
    id: string;
    items: {
        unicode: string;
    }[]
}

type TGroupIcon = { type: 'symbol' | 'emoji' | 'img' | ''; value: string };
type TTab = 'symbols' | 'emojis' | 'dynamic' | 'image';

/**
 * 思源动态图标由内核按参数实时渲染 SVG，返回的地址可以直接当图片用。
 * type 1~7 为日期类图标，type 8 渲染自定义文字。
 */
const DYNAMIC_ICON_API = 'api/icon/getDynamicIcon';
const DYNAMIC_ICON_TYPES = ['1', '2', '3', '4', '5', '6', '7'];
const DYNAMIC_ICON_COLORS = ['#d23f31', '#3575f0', '#f3a92f', '#65b84d', '#e099ff', '#ea5d97', '#93627f', '#5f6368'];
const ICON_SIZE = '20px';

const chooseStyle = () => ({
    display: 'inline-block', cursor: 'pointer', margin: '5px'
});

const IconItem = (props: { choose: () => void; children: any; selected?: boolean }) => (
    <div style={{
        ...chooseStyle(),
        outline: props.selected ? '2px solid var(--b3-theme-primary)' : 'none',
        'border-radius': '4px',
    }} onClick={() => props.choose()}>
        {props.children}
    </div>
);

const SymbolIcons = (props: { choose: (icon: TGroupIcon) => void }) => {
    const symbols = Array.from(document.querySelectorAll('symbol'));
    return (
        <div class="icons">
            <For each={symbols}>
                {(symbol) => (
                    <IconItem choose={() => props.choose({ type: 'symbol', value: symbol.id })}>
                        <Icon symbol={symbol.id} width={ICON_SIZE} height={ICON_SIZE} />
                    </IconItem>
                )}
            </For>
        </div>
    );
};

const EmojiIcons = (props: { choose: (icon: TGroupIcon) => void }) => {
    const ALLOWED_EMOJI_GROUP = ['activity', 'travel', 'people', 'nature', 'food', 'symbols', 'object', 'flags'];
    let EmojisGroups = (window.siyuan.emojis as ImojiGroup[]).filter(emoji => ALLOWED_EMOJI_GROUP.includes(emoji.id));
    EmojisGroups.sort((a, b) => ALLOWED_EMOJI_GROUP.indexOf(a.id) - ALLOWED_EMOJI_GROUP.indexOf(b.id))
    const emojiUnicodes = EmojisGroups.map(group => group.items.map(item => item.unicode)).flat();

    return (
        <div class="icons">
            <For each={emojiUnicodes}>
                {(unicode) => (
                    <IconItem choose={() => props.choose({ type: 'emoji', value: unicode })}>
                        <Icon emojiCode={unicode} width={ICON_SIZE} height={ICON_SIZE} fontSize={ICON_SIZE} />
                    </IconItem>
                )}
            </For>
        </div>
    );
};

const DynamicIcons = (props: { choose: (icon: TGroupIcon) => void }) => {
    const [color, setColor] = createSignal(DYNAMIC_ICON_COLORS[1]);
    const [text, setText] = createSignal('');

    const dynamicIconUrl = (query: Record<string, string>) => {
        const params = new URLSearchParams({ ...query, color: color() });
        return `${DYNAMIC_ICON_API}?${params.toString()}`;
    };
    const dateIconUrl = (type: string) => dynamicIconUrl({ type });
    const textIconUrl = () => dynamicIconUrl({ type: '8', content: text() });

    return (
        <div>
            <div class="fn__flex" style={{ 'align-items': 'center', gap: '8px', 'flex-wrap': 'wrap' }}>
                <span class="ft__on-surface">{window.siyuan.languages.colorFont}</span>
                <For each={DYNAMIC_ICON_COLORS}>
                    {(preset) => (
                        <div
                            class="fn__pointer"
                            style={{
                                width: '16px', height: '16px', 'border-radius': '2px', 'background-color': preset,
                                outline: color() === preset ? '2px solid var(--b3-theme-primary)' : 'none'
                            }}
                            onClick={() => setColor(preset)}
                        />
                    )}
                </For>
                <input
                    type="color" class="b3-text-field fn__flex-center" value={color()}
                    onInput={(e) => setColor(e.currentTarget.value)}
                />
            </div>

            <div class="fn__hr" />
            <div class="icons">
                <For each={DYNAMIC_ICON_TYPES}>
                    {(type) => (
                        <IconItem choose={() => props.choose({ type: 'img', value: dateIconUrl(type) })}>
                            <img src={dateIconUrl(type)} alt="" style={{ width: '32px', height: '32px' }} />
                        </IconItem>
                    )}
                </For>
            </div>

            <div class="fn__hr" />
            <div class="fn__flex" style={{ 'align-items': 'center', gap: '8px' }}>
                <span class="ft__on-surface">{i18n.selecticon.dynamictext}</span>
                <input
                    class="b3-text-field fn__flex-1" value={text()} placeholder={i18n.selecticon.dynamictexthint}
                    onInput={(e) => setText(e.currentTarget.value)}
                />
                <button
                    class="b3-button b3-button--text" disabled={!text().trim()}
                    onClick={() => props.choose({ type: 'img', value: textIconUrl() })}
                >
                    {i18n.selecticon.confirm}
                </button>
            </div>
            <Show when={text().trim()}>
                <div style={{ margin: '8px 0' }}>
                    <img src={textIconUrl()} alt="" style={{ width: '32px', height: '32px' }} />
                </div>
            </Show>
        </div>
    );
};

const ImageIcons = (props: { choose: (icon: TGroupIcon) => void }) => {
    const [url, setUrl] = createSignal('');
    const validUrl = () => url().trim();
    const chooseUrl = () => props.choose({ type: 'img', value: validUrl() });

    return (
        <div>
            <div class="fn__flex" style={{ 'align-items': 'center', gap: '8px' }}>
                <input
                    class="b3-text-field fn__flex-1" value={url()} placeholder={i18n.selecticon.imagehint}
                    onInput={(e) => setUrl(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && validUrl()) chooseUrl();
                    }}
                />
                <button class="b3-button b3-button--text" disabled={!validUrl()} onClick={chooseUrl}>
                    {i18n.selecticon.confirm}
                </button>
            </div>
            <Show when={validUrl()}>
                <div style={{ margin: '12px 0' }}>
                    <img src={url()} alt="" style={{ 'max-width': '100%', 'max-height': '160px' }} />
                </div>
            </Show>
        </div>
    );
};

const SelectIcons = (props: {
    show: 'symbols' | 'emojis' | 'all';
    choose: (args: TGroupIcon) => void;
}) => {
    const [activeTab, setActiveTab] = createSignal<TTab>('symbols');

    const tabs = () => [
        { id: 'symbols' as TTab, label: 'Symbols', visible: props.show === 'all' || props.show === 'symbols' },
        { id: 'emojis' as TTab, label: 'Emojis', visible: props.show === 'all' || props.show === 'emojis' },
        { id: 'dynamic' as TTab, label: i18n.selecticon.dynamic, visible: props.show === 'all' },
        { id: 'image' as TTab, label: i18n.selecticon.image, visible: props.show === 'all' },
    ];

    return (
        <div style={{ margin: '10px 24px' }}>
            <div style={{ display: 'flex', 'align-items': 'center', gap: '15px' }}>
                <h3>{i18n.selecticon.h3}</h3>
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <For each={tabs().filter(tab => tab.visible)}>
                        {(tab) => (
                            <button
                                class={`b3-button ${activeTab() === tab.id ? 'b3-button--text' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        )}
                    </For>
                </div>
                <button class="b3-button" onClick={() => props.choose({ type: '', value: '' })}>{i18n.selecticon.reset}</button>
            </div>

            <br />

            <Show when={activeTab() === 'symbols'}>
                <SymbolIcons choose={props.choose} />
            </Show>
            <Show when={activeTab() === 'emojis'}>
                <EmojiIcons choose={props.choose} />
            </Show>
            <Show when={activeTab() === 'dynamic'}>
                <DynamicIcons choose={props.choose} />
            </Show>
            <Show when={activeTab() === 'image'}>
                <ImageIcons choose={props.choose} />
            </Show>
        </div>
    );
}

export const selectGroupIcon = (param: {
    show: 'symbols' | 'emojis' | 'all';
    onReset: () => void;
    onUpdate: (icon: TGroupIcon) => void;
}) => {
    const chooseIcon = (icon: TGroupIcon) => {
        close();
        if (icon.type === '' && icon.value === '') {
            param.onReset();
        } else {
            param.onUpdate(icon);
        }
    }

    const { close } = solidDialog({
        title: i18n.selecticon.title,
        loader: () => <SelectIcons choose={chooseIcon} show={param.show} />,
        width: '800px',
        height: '600px'
    });
}

export default SelectIcons;
