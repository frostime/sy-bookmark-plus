import { createEffect, createMemo, createSignal, For, JSX, onCleanup, Show } from "solid-js";
import { solidDialog } from "@/libs/dialog";
import { i18n, renderI18n } from "@/utils/i18n";
import Icon from "./icon";
import { GroupIcon } from "./group-icon";
import { buildDynamicIcon, DEFAULT_ICON_COLOR, GroupIconValue, MAX_ICON_FILE_BYTES, readDynamicIcon } from "./group-icon-value";
import "./select-icon.scss";

type PickerTab = 'symbols' | 'emojis' | 'dynamic' | 'image';
type DynamicKind = 'date' | 'text';
type PickerMode = 'symbols' | 'emojis' | 'all';
interface PickerProps {
    show: PickerMode;
    current?: GroupIconValue | null;
    name?: string;
    defaultSymbol?: string;
    allowReset?: boolean;
    onApply: (icon: GroupIconValue | null) => void;
    onCancel: () => void;
}

const COLORS = ['#d23f31', '#3575f0', '#f3a92f', '#65b84d', '#e099ff', '#ea5d97', '#93627f', '#5f6368'];
const DATE_TYPES = ['1', '2', '3', '4', '5', '6', '7'];
const EMOJI_GROUPS = ['activity', 'travel', 'people', 'nature', 'food', 'symbols', 'object', 'flags'];

const IconChoice = (props: { selected: boolean; label: string; onClick: () => void; children: JSX.Element }) => (
    <button type="button" class="bookmark-icon-picker__choice" classList={{ 'is-selected': props.selected }}
        aria-pressed={props.selected} title={props.label} onClick={props.onClick}>
        {props.children}
    </button>
);

const SelectIcons = (props: PickerProps) => {
    const labels = i18n.selecticon;
    const original = readDynamicIcon(props.current);
    const initialTab: PickerTab = props.show !== 'all' ? props.show
        : original ? 'dynamic' : props.current?.type === 'img' ? 'image'
            : props.current?.type === 'emoji' ? 'emojis' : 'symbols';
    const [activeTab, setActiveTab] = createSignal<PickerTab>(initialTab);
    const [reset, setReset] = createSignal(!props.current?.value);
    const [symbol, setSymbol] = createSignal(props.current?.type === 'symbol' ? props.current.value : (props.defaultSymbol ?? 'iconFolder'));
    const [emoji, setEmoji] = createSignal(props.current?.type === 'emoji' ? props.current.value : '1f4cc');
    const [dynamicKind, setDynamicKind] = createSignal<DynamicKind>(original?.get('type') === '8' ? 'text' : 'date');
    const [dateType, setDateType] = createSignal(original?.get('type') === '8' ? '1' : (original?.get('type') ?? '1'));
    const [color, setColor] = createSignal(original?.get('color') || DEFAULT_ICON_COLOR);
    const [text, setText] = createSignal(original?.get('content') ?? '');
    const [date, setDate] = createSignal(original?.get('date') ?? '');
    const initialImage = !original && props.current?.type === 'img' ? props.current.value : '';
    const [imageSource, setImageSource] = createSignal(initialImage);
    const [imageAddress, setImageAddress] = createSignal(initialImage.startsWith('data:') ? '' : initialImage);
    const [fileName, setFileName] = createSignal('');
    const [fileError, setFileError] = createSignal('');
    const [readingFile, setReadingFile] = createSignal(false);
    const [imageStatus, setImageStatus] = createSignal<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [imageRetry, setImageRetry] = createSignal(0);
    let reader: FileReader | undefined;
    let fileInput!: HTMLInputElement;
    let disposed = false;
    onCleanup(() => { disposed = true; reader?.abort(); });

    const symbols = Array.from(new Set(Array.from(document.querySelectorAll('symbol[id]')).map(element => element.id)));
    const emojis = EMOJI_GROUPS.flatMap(id => {
        const group = (window.siyuan.emojis as { id: string; items: { unicode: string }[] }[]).find(group => group.id === id);
        return group?.items.map(item => item.unicode) ?? [];
    });
    const tabs = [
        { id: 'symbols' as const, label: labels.symbols },
        { id: 'emojis' as const, label: labels.emojis },
        { id: 'dynamic' as const, label: labels.dynamic },
        { id: 'image' as const, label: labels.image },
    ].filter(tab => props.show === 'all' || tab.id === props.show);
    const select = (action: () => void) => { setReset(false); action(); };
    const stopReadingFile = () => {
        const previous = reader;
        reader = undefined;
        previous?.abort();
        setReadingFile(false);
    };
    const dynamicIcon = (type: string) => buildDynamicIcon(original, { type, color: color(), text: text(), date: date() });
    // null means restore the group's default; undefined means the draft is incomplete.
    const selectedIcon = createMemo<GroupIconValue | null | undefined>(() => {
        if (reset()) return null;
        switch (activeTab()) {
            case 'symbols': return { type: 'symbol', value: symbol() };
            case 'emojis': return { type: 'emoji', value: emoji() };
            case 'dynamic':
                if (dynamicKind() === 'text') return text().trim() ? dynamicIcon('8') : undefined;
                return dateType() === '7' && !date() ? undefined : dynamicIcon(dateType());
            case 'image': return imageSource() ? { type: 'img', value: imageSource() } : undefined;
        }
    });
    const previewSource = createMemo(() => selectedIcon()?.type === 'img' ? selectedIcon()!.value : '');
    createEffect(() => {
        imageRetry();
        const source = previewSource();
        if (!source) { setImageStatus('idle'); return; }
        setImageStatus('loading');
        const image = new Image();
        image.onload = () => setImageStatus('ready');
        image.onerror = () => setImageStatus('error');
        onCleanup(() => { image.onload = null; image.onerror = null; });
        image.src = source;
    });
    const canApply = () => selectedIcon() !== undefined
        && (reset() || activeTab() !== 'image' || (!readingFile() && !fileError()))
        && (selectedIcon()?.type !== 'img' || imageStatus() === 'ready');
    const changeTab = (tab: PickerTab) => {
        stopReadingFile();
        select(() => setActiveTab(tab));
    };
    const chooseAddress = (value: string) => {
        stopReadingFile();
        setFileError('');
        setFileName('');
        select(() => { setImageAddress(value); setImageSource(value.trim()); });
    };
    const chooseFile = (file?: File) => {
        if (!file) return;
        stopReadingFile();
        setFileError('');
        if (!file.type.startsWith('image/')) { setFileError(labels.invalidfile); return; }
        if (file.size > MAX_ICON_FILE_BYTES) { setFileError(labels.filetoolarge); return; }
        setReadingFile(true);
        const currentReader = new FileReader();
        reader = currentReader;
        currentReader.onload = () => {
            if (disposed || reader !== currentReader) return;
            setReadingFile(false);
            select(() => {
                setImageAddress('');
                setFileName(file.name);
                setImageSource(String(currentReader.result));
            });
        };
        currentReader.onerror = () => {
            if (disposed || reader !== currentReader) return;
            setReadingFile(false);
            setFileError(labels.filereaderror);
        };
        currentReader.readAsDataURL(file);
    };
    const preview = (size: string) => (
        // A retry must also replace failed preview images, even when their URL is unchanged.
        <Show when={{ icon: selectedIcon(), revision: imageRetry() }} keyed>
            {draft => <Show when={draft.icon !== undefined} fallback={<span class="bookmark-icon-picker__empty">—</span>}>
                <GroupIcon group={{ icon: draft.icon, type: 'normal' }} size={size} defaultSymbol={props.defaultSymbol} />
            </Show>}
        </Show>
    );

    return (
        <div class="bookmark-icon-picker">
            <Show when={props.name}>
                <p class="bookmark-icon-picker__subtitle">{renderI18n(labels.subtitle, props.name)}</p>
            </Show>
            <nav class="bookmark-icon-picker__tabs" role="tablist" aria-label={labels.h3}>
                <For each={tabs}>{tab => (
                    <button type="button" role="tab" aria-selected={activeTab() === tab.id}
                        data-tab={tab.id} onClick={() => changeTab(tab.id)}>{tab.label}</button>
                )}</For>
            </nav>
            <div class="bookmark-icon-picker__body">
                <div class="bookmark-icon-picker__controls">
                    <Show when={activeTab() === 'symbols'}>
                        <div class="bookmark-icon-picker__grid">
                            <For each={symbols}>{id => (
                                <IconChoice label={id} selected={!reset() && symbol() === id}
                                    onClick={() => select(() => setSymbol(id))}>
                                    <Icon symbol={id} width="24px" height="24px" />
                                </IconChoice>
                            )}</For>
                        </div>
                    </Show>
                    <Show when={activeTab() === 'emojis'}>
                        <div class="bookmark-icon-picker__grid">
                            <For each={emojis}>{code => (
                                <IconChoice label={code} selected={!reset() && emoji() === code}
                                    onClick={() => select(() => setEmoji(code))}>
                                    <Icon emojiCode={code} width="24px" height="24px" fontSize="24px" />
                                </IconChoice>
                            )}</For>
                        </div>
                    </Show>
                    <Show when={activeTab() === 'dynamic'}>
                        <div class="bookmark-icon-picker__segment">
                            <For each={['date', 'text'] as const}>{kind => (
                                <button type="button" data-kind={kind} aria-pressed={dynamicKind() === kind}
                                    onClick={() => select(() => setDynamicKind(kind))}>
                                    {kind === 'date' ? labels.dateicons : labels.texticons}
                                </button>
                            )}</For>
                        </div>
                        <Show when={dynamicKind() === 'date'} fallback={
                            <label class="bookmark-icon-picker__field">
                                <span>{labels.dynamictext}</span>
                                <input class="b3-text-field" data-field="text" value={text()} placeholder={labels.dynamictexthint}
                                    onInput={event => select(() => setText(event.currentTarget.value))} />
                                <small>{labels.texthelp}</small>
                            </label>
                        }>
                            <div class="bookmark-icon-picker__grid bookmark-icon-picker__dates">
                                <For each={DATE_TYPES}>{type => (
                                    <IconChoice label={labels.datestyles[Number(type) - 1]}
                                        selected={!reset() && dateType() === type} onClick={() => select(() => setDateType(type))}>
                                        <Icon img={dynamicIcon(type).value} width="32px" height="32px" />
                                        <span>{labels.datestyles[Number(type) - 1]}</span>
                                    </IconChoice>
                                )}</For>
                            </div>
                            <label class="bookmark-icon-picker__field bookmark-icon-picker__date">
                                <span>{dateType() === '7' ? labels.targetdate : labels.date}</span>
                                <input class="b3-text-field" type="date" value={date()} data-field="date"
                                    onInput={event => select(() => setDate(event.currentTarget.value))} />
                                <small>{dateType() === '7' ? labels.countdownhelp : labels.datehelp}</small>
                            </label>
                        </Show>
                        <div class="bookmark-icon-picker__colors">
                            <span>{labels.color}</span>
                            <For each={COLORS}>{preset => (
                                <button type="button" class="bookmark-icon-picker__swatch" title={preset}
                                    aria-label={preset} aria-pressed={color() === preset} style={{ background: preset }}
                                    onClick={() => select(() => setColor(preset))} />
                            )}</For>
                            <label class="bookmark-icon-picker__custom-color" title={labels.customcolor}>
                                +<input type="color" value={color()} aria-label={labels.customcolor}
                                    onInput={event => select(() => setColor(event.currentTarget.value))} />
                            </label>
                        </div>
                    </Show>
                    <Show when={activeTab() === 'image'}>
                        <div class="bookmark-icon-picker__upload">
                            <input ref={fileInput} type="file" accept="image/*" hidden onChange={event => {
                                chooseFile(event.currentTarget.files?.[0]);
                                event.currentTarget.value = '';
                            }} />
                            <button type="button" class="b3-button b3-button--outline" onClick={() => fileInput.click()}>{labels.choosefile}</button>
                            <p>{labels.filehint}</p>
                        </div>
                        <div class="bookmark-icon-picker__divider">{labels.oraddress}</div>
                        <label class="bookmark-icon-picker__field">
                            <span>{labels.imageaddress}</span>
                            <input class="b3-text-field" data-field="image" value={imageAddress()} placeholder={labels.imagehint}
                                onInput={event => chooseAddress(event.currentTarget.value)} />
                        </label>
                        <p class="bookmark-icon-picker__status" aria-live="polite">
                            {fileName() || (imageSource().startsWith('data:') ? labels.savedfile : '')}
                        </p>
                        <Show when={fileError()}><p class="bookmark-icon-picker__error" role="alert">{fileError()}</p></Show>
                    </Show>
                </div>
                <aside class="bookmark-icon-picker__preview">
                    <p>{labels.largepreview}</p>
                    <div class="bookmark-icon-picker__large">{preview('48px')}</div>
                    <p>{labels.actualpreview}</p>
                    <div class="bookmark-icon-picker__row"><span class="bookmark-icon-picker__arrow">⌄</span><Icon symbol="iconFolder" />{labels.referencegroup}</div>
                    <div class="bookmark-icon-picker__row" data-preview="actual"><span class="bookmark-icon-picker__arrow">⌄</span>{preview('16px')}<span>{props.name || labels.previewgroup}</span></div>
                    <div class="bookmark-icon-picker__row"><span class="bookmark-icon-picker__arrow">⌄</span><Icon emojiCode="1f4cc" />{labels.referenceemoji}</div>
                    <small>{labels.previewhelp}</small>
                    <p class="bookmark-icon-picker__status" aria-live="polite">
                        {readingFile() ? labels.reading : imageStatus() === 'loading' ? labels.loading : ''}
                    </p>
                    <Show when={imageStatus() === 'error'}>
                        <p class="bookmark-icon-picker__error" role="alert">{labels.imageerror}</p>
                        <button type="button" class="b3-button b3-button--outline" data-action="retry"
                            onClick={() => setImageRetry(value => value + 1)}>{labels.retry}</button>
                    </Show>
                </aside>
            </div>
            <footer class="bookmark-icon-picker__footer">
                <div><Show when={props.allowReset}>
                    <button type="button" class="bookmark-icon-picker__reset" onClick={() => {
                        stopReadingFile(); setFileError('');
                        setActiveTab(props.show === 'emojis' ? 'emojis' : 'symbols'); setReset(true);
                    }}>{labels.reset}</button>
                </Show></div>
                <div class="bookmark-icon-picker__actions">
                    <button type="button" class="b3-button b3-button--outline" onClick={props.onCancel}>{labels.cancel}</button>
                    <button type="button" class="b3-button" data-action="apply" disabled={!canApply()} onClick={() => {
                        const icon = selectedIcon();
                        if (icon !== undefined && canApply()) props.onApply(icon);
                    }}>{labels.apply}</button>
                </div>
            </footer>
        </div>
    );
};

export const selectGroupIcon = (param: {
    show: PickerMode;
    current?: GroupIconValue | null;
    name?: string;
    defaultSymbol?: string;
    onReset?: () => void;
    onUpdate: (icon: GroupIconValue) => void;
}) => {
    const { close } = solidDialog({
        title: i18n.selecticon.title,
        loader: () => <SelectIcons {...param} allowReset={!!param.onReset} onCancel={() => close()}
            onApply={(icon) => {
                if (icon) param.onUpdate(icon);
                else param.onReset?.();
                close();
            }} />,
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '90vh',
    });
};

export default SelectIcons;
