import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

function removePath(path) {
    if (!existsSync(path)) {
        return;
    }

    if (lstatSync(path).isDirectory()) {
        for (const entry of readdirSync(path)) {
            removePath(join(path, entry));
        }
        rmdirSync(path);
        return;
    }

    unlinkSync(path);
}

// dev will be symlinked to siyuan workspace, so by default not removed
for (const path of ["dist", "package.zip"]) {
    removePath(path);
}
