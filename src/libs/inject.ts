const Storage = {};

export const provide = <T>(key: string, value: T) => {
    Storage[key] = value;
}

export const inject = <T>(key: string): T => {
    return Storage[key];
}

export const purge = (key?: string) => {
    if (key) {
        delete Storage[key];
    } else {
        for (const key in Storage) {
            delete Storage[key];
        }
    }
}
