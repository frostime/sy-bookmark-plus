/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Description: Plugin-owned dialogs. Discarding releases content without submitting drafts.
 */
import { Dialog } from 'siyuan';
import { JSXElement } from 'solid-js';
import { render } from 'solid-js/web';
import { simpleDialog, confirmDialog as kitConfirmDialog, inputDialog as kitInputDialog } from '@frostime/siyuan-plugin-kits';

const openDialogs = new Map<Dialog, () => void>();

function trackDialog<T extends { dialog: Dialog }>(
    create: (closed: () => void) => T,
    cleanup?: () => void,
    onClose?: () => void
): T {
    let discarded = false;
    const result = create(() => {
        openDialogs.delete(result.dialog);
        cleanup?.();
        if (!discarded) onClose?.();
    });
    openDialogs.set(result.dialog, () => {
        discarded = true;
        result.dialog.destroy();
    });
    return result;
}

export const openDialogCount = () => openDialogs.size;
export const discardAllDialogs = () => {
    for (const discard of [...openDialogs.values()]) discard();
};

export const solidDialog = (args: {
    title: string; loader: () => JSXElement;
    width?: string; height?: string;
    maxWidth?: string; maxHeight?: string;
    callback?: () => void;
}) => {
    const container = document.createElement('div');
    container.style.display = 'contents';
    const dispose = render(args.loader, container);
    const result = trackDialog(closed => simpleDialog({ ...args, ele: container, callback: closed }), dispose, args.callback);
    return { ...result, container };
};

export const confirmDialog = (args: Parameters<typeof kitConfirmDialog>[0]): Dialog => {
    return trackDialog(closed => kitConfirmDialog({ ...args, destroyCallback: closed }), args.destroyCallback).dialog;
};

export const inputDialog = (args: Omit<Parameters<typeof kitInputDialog>[0], 'destroyCallback'>) => {
    return trackDialog(closed => kitInputDialog({ ...args, destroyCallback: closed }));
};

/** Same call shape as the host confirm, but the dialog belongs to this plugin. */
export const confirm = (title: string, content: string, accept: () => void, cancel?: () => void) => {
    confirmDialog({ title, content, confirm: accept, cancel });
};
