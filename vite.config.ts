import { resolve } from "path"
import { defineConfig, loadEnv } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import livereload from "rollup-plugin-livereload"
import solidPlugin from 'vite-plugin-solid';
import zipPack from "vite-plugin-zip-pack";
import fg from 'fast-glob';

import vitePluginYamlI18n from './yaml-plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isSrcmap = env.VITE_SOURCEMAP === 'inline';
    const isDev = mode === 'development';
    const distDir = isDev ? "dev" : "dist";

    console.log("isDev=>", isDev);
    console.log("isSrcmap=>", isSrcmap);

    return {
        resolve: {
            alias: {
                "@": resolve(__dirname, "src"),
            }
        },

        plugins: [
            solidPlugin({
                babel: {
                    plugins: ['solid-styled-jsx/babel']
                }
            }),

            vitePluginYamlI18n({
                inDir: 'public/i18n',
                outDir: `${distDir}/i18n`
            }),

            viteStaticCopy({
                targets: [
                    { src: "./README*.md", dest: "./" },
                    { src: "./plugin.json", dest: "./" },
                    { src: "./preview.png", dest: "./" },
                    { src: "./icon.png", dest: "./" }
                ],
            }),
        ],

        define: {
            "process.env.DEV_MODE": JSON.stringify(isDev),
            "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
        },

        build: {
            outDir: distDir,
            emptyOutDir: false,
            minify: true,
            sourcemap: isSrcmap ? 'inline' : false,

            lib: {
                entry: resolve(__dirname, "src/index.ts"),
                fileName: "index",
                formats: ["cjs"],
            },
            rollupOptions: {
                plugins: [
                    ...(isDev ? [
                        livereload(distDir),
                        {
                            name: 'watch-external',
                            async buildStart() {
                                const files = await fg([
                                    'public/i18n/**',
                                    './README*.md',
                                    './plugin.json'
                                ]);
                                for (let file of files) {
                                    this.addWatchFile(file);
                                }
                            }
                        }
                    ] : [
                        zipPack({
                            inDir: './dist',
                            outDir: './',
                            outFileName: 'package.zip'
                        })
                    ])
                ],

                external: ["siyuan", "process"],

                output: {
                    entryFileNames: "[name].js",
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name === "style.css") {
                            return "index.css"
                        }
                        return assetInfo.name
                    },
                },
            },
        }
    }
})
