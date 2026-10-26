export type GroupIconValue = NonNullable<IBookmarkGroup['icon']>;

export const DYNAMIC_ICON_API = 'api/icon/getDynamicIcon';
export const DEFAULT_ICON_COLOR = '#3575f0';
export const MAX_ICON_FILE_BYTES = 1024 * 1024;

/** Preserve date, language and other kernel parameters when editing an existing dynamic icon. */
export const readDynamicIcon = (icon?: GroupIconValue | null): URLSearchParams | null => {
    if (icon?.type !== 'img') return null;
    const separator = icon.value.indexOf('?');
    const path = separator < 0 ? icon.value : icon.value.slice(0, separator);
    const query = separator < 0 ? '' : icon.value.slice(separator + 1);
    if (path !== DYNAMIC_ICON_API && path !== `/${DYNAMIC_ICON_API}`) return null;
    const parameters = new URLSearchParams(query);
    const type = parameters.get('type') || '1';
    if (!/^[1-8]$/.test(type)) return null;
    parameters.set('type', type);
    return parameters;
};

export const buildDynamicIcon = (
    original: URLSearchParams | null,
    options: { type: string; color: string; text: string; date?: string }
): GroupIconValue => {
    const parameters = new URLSearchParams(original ?? undefined);
    parameters.delete('_fontRefresh');
    parameters.set('type', options.type);
    parameters.set('color', options.color);
    if (options.type === '8') parameters.set('content', options.text);
    else {
        parameters.delete('content');
        if (options.date !== undefined) {
            if (options.date) parameters.set('date', options.date);
            else parameters.delete('date');
        }
    }
    return { type: 'img', value: `${DYNAMIC_ICON_API}?${parameters.toString()}` };
};
