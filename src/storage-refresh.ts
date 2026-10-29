import { Dialog } from 'siyuan';
import { discardAllDialogs, openDialogCount } from './libs/dialog';
import { disableAutoRefresh } from './model/auto-refresh';
import { bookmarkStorage, withRefreshTimeout } from './model/storage';
import { rebuildBookmarkViews, setBookmarkStatus, syncSubViewDocks, updateBookmarkViews } from './dock-views';
import type PluginBookmarkPlus from './index';
import type { BookmarkDataModel } from './model';

/** Single-device refresh, not a multi-device editing/merge protocol. */
export class StorageRefresh {
    private task?: Promise<void>;
    private requested = false;
    private disposed = false;
    private docksReady = false;
    private queries = new Set<Promise<unknown>>();
    private warning?: Dialog;
    private failure?: Dialog;

    constructor(private plugin: PluginBookmarkPlus, private model: BookmarkDataModel) {
        // Drain model-owned queries before replacing data. This does not claim to
        // cover arbitrary pending UI actions or user JS; concurrent editing is unsupported.
        const track = <Args extends unknown[]>(query: (...args: Args) => Promise<void>) => (...args: Args) => {
            const task = query(...args);
            this.queries.add(task);
            void task.then(() => this.queries.delete(task), () => this.queries.delete(task));
            return task;
        };
        model.updateViews = track(model.updateViews.bind(model));
        model.updateDynamicGroup = track(model.updateDynamicGroup.bind(model));
        model.updateGroupStaticItems = track(model.updateGroupStaticItems.bind(model));
    }

    activateDocks() { this.docksReady = true; }

    request(): Promise<void> {
        if (this.disposed) return Promise.resolve();
        this.failure?.destroy();
        this.requested = true;
        if (!this.task) {
            this.task = Promise.resolve().then(() => this.refresh()).finally(() => { this.task = undefined; });
        }
        return this.task;
    }

    private warnAboutConcurrentEditing() {
        if (this.warning) return;
        const text = this.plugin.i18n.sync;
        this.warning = new Dialog({
            title: text.conflictTitle,
            content: `<div class="b3-dialog__content">${text.conflictBody}</div>
                <div class="b3-dialog__action"><button class="b3-button">${text.acknowledge}</button></div>`,
            width: '520px',
            destroyCallback: () => { this.warning = undefined; }
        });
        this.warning.element.querySelector('button')?.addEventListener('click', () => this.warning?.destroy());
    }

    private showReadFailure() {
        const text = this.plugin.i18n.sync;
        this.failure = new Dialog({
            title: 'Bookmark+',
            content: `<div class="b3-dialog__content">${text.readFailed}</div>
                <div class="b3-dialog__action"><button class="b3-button">${text.retry}</button></div>`,
            width: '520px',
            destroyCallback: () => { this.failure = undefined; }
        });
        this.failure.element.querySelector('button')?.addEventListener('click', () => { void this.request(); });
    }

    private async refresh() {
        while (this.requested && !this.disposed) {
            this.requested = false;
            const overlappingEdit = bookmarkStorage.hasPendingChanges || openDialogCount() > 0;
            bookmarkStorage.pause();
            disableAutoRefresh();
            setBookmarkStatus(this.plugin.i18n.sync.loading);
            discardAllDialogs();
            if (this.docksReady && overlappingEdit) this.warnAboutConcurrentEditing();
            try {
                await bookmarkStorage.settleWrites();
                await withRefreshTimeout((async () => {
                    while (this.queries.size > 0) await Promise.allSettled([...this.queries]);
                })());
                this.model.updateGroupStaticItemsDebounced.cancel();
                const prepared = await this.model.readStorage();
                if (this.disposed) return;
                if (this.requested) continue;
                if (this.docksReady) {
                    rebuildBookmarkViews(prepared.apply);
                    syncSubViewDocks(this.plugin);
                } else {
                    prepared.apply();
                }
                this.plugin.applySettings();
                bookmarkStorage.resume();
                setBookmarkStatus();
                if (prepared.migrated) this.model.save();
                if (this.docksReady) {
                    void updateBookmarkViews().catch(error => console.error('[Bookmark+] query failed', error));
                }
            } catch (error) {
                if (this.disposed) return;
                if (this.requested) continue;
                bookmarkStorage.pause();
                console.error('[Bookmark+] storage refresh failed', error);
                const displayed = setBookmarkStatus(this.plugin.i18n.sync.readFailed, () => { void this.request(); });
                if (!displayed) this.showReadFailure();
                break;
            }
        }
    }

    dispose() {
        this.disposed = true;
        bookmarkStorage.pause();
        this.model.updateGroupStaticItemsDebounced.cancel();
        disableAutoRefresh();
        discardAllDialogs();
        this.warning?.destroy();
        this.failure?.destroy();
    }
}
