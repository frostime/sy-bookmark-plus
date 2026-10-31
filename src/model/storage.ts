import { thisPlugin } from '@frostime/siyuan-plugin-kits';
import { debounce } from '../utils';

const IO_TIMEOUT_MS = 15000;

export async function withRefreshTimeout<T>(task: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    try {
        return await Promise.race([
            task,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error('Bookmark+ storage refresh timed out')), IO_TIMEOUT_MS);
            })
        ]);
    } finally {
        clearTimeout(timer);
    }
}

/** Normal callers only read, write, or defer a save. Refresh owns the write gate. */
class BookmarkStorage {
    private paused = true;
    private writes = new Set<Promise<unknown>>();
    private deferred = new Set<{ cancel(): void; pending(): boolean }>();

    get hasPendingChanges() {
        return this.writes.size > 0 || [...this.deferred].some(save => save.pending());
    }

    deferSave<T extends (...args: any[]) => unknown>(save: T, delay: number) {
        const deferred = debounce((...args: Parameters<T>) => {
            if (!this.paused) {
                void Promise.resolve(save(...args)).catch(error => console.error('[Bookmark+] save failed', error));
            }
        }, delay);
        const schedule = Object.assign((...args: Parameters<T>) => {
            if (!this.paused) deferred(...args);
        }, { cancel: deferred.cancel, pending: deferred.pending });
        this.deferred.add(schedule);
        return schedule;
    }

    pause() {
        this.paused = true;
        for (const save of this.deferred) save.cancel();
    }

    resume() { this.paused = false; }

    async settleWrites() {
        // A timeout does not cancel a host write. Remain paused if it cannot settle.
        await withRefreshTimeout(Promise.allSettled([...this.writes]));
    }

    async write(file: string, value: unknown) {
        if (this.paused) return;
        const write = thisPlugin().saveData(file, value);
        this.writes.add(write);
        try {
            await write;
        } finally {
            this.writes.delete(write);
        }
    }

    async read(file: string): Promise<Record<string, any> | undefined> {
        // loadData can return its old instance cache on failure, not the synced file.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), IO_TIMEOUT_MS);
        try {
            const response = await fetch('/api/file/getFile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `/data/storage/petal/${thisPlugin().name}/${file}` }),
                signal: controller.signal
            });
            const value = await response.json();
            if (response.status === 202 && value?.code === 404) return undefined;
            if (response.status !== 200 || !value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error(`Cannot read Bookmark+ storage: ${file} (HTTP ${response.status})`);
            }
            return value;
        } finally {
            clearTimeout(timer);
        }
    }
}

export const bookmarkStorage = new BookmarkStorage();
