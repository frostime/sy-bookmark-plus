import { showMessage, fetchPost, Protyle, type App } from "siyuan";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import { version, sql as query } from "@/api";

interface Block {
    id: string;
    // Define other properties of Block interface if necessary
}

const randInt = () => Math.floor(255 * Math.random());

const Component = (props: {app: App}) => {
    let app = props.app;

    let time: string = "";
    let ver: string = "";

    let divProtyle: HTMLDivElement;
    let protyle: any;
    let blockID: string = '';

    let [color, setColor] = createSignal({r: 255, g: 255, b: 255});

    setInterval(() => {
        setColor({
            r: randInt(),
            g: randInt(),
            b: randInt(),
        })
    }, 1000);

    onMount(async () => {
        ver = await version();
        fetchPost("/api/system/currentTime", {}, (response) => {
            time = new Date(response.data).toString();
        });
        protyle = await initProtyle();
        showMessage("On mount")
    });

    onCleanup(() => {
        showMessage("Hello panel closed");
        protyle.destroy();
    });

    async function initProtyle() {
        let sql = "SELECT * FROM blocks ORDER BY RANDOM () LIMIT 1;";
        let blocks: Block[] = await query(sql);
        blockID = blocks[0].id;
        return new Protyle(app, divProtyle, {
            blockId: blockID
        });
    }

    return (
        <div class="b3-dialog__content">
            <div>appId:</div>
            <div class="fn__hr"></div>
            <div class="plugin-sample__time">{app?.appId}</div>
            <div class="fn__hr"></div>
            <div class="fn__hr"></div>
            <div>API demo:</div>
            <div class="fn__hr" />
            <div class="plugin-sample__time">
                System current time: <span id="time">{time}</span>
            </div>
            <div class="fn__hr" />
            <div class="fn__hr" />
            <div>Protyle demo: id = {blockID}</div>
            <div class="fn__hr" />
            <div id="protyle" style={{ height: '360px' }} ref={divProtyle}/>
            <style jsx dynamic>
                {`
                    .plugin-sample__time {
                        background-color: rgb(${color().r}, ${color().g}, ${color().b});
                    }
                    #protyle {
                        border: 2px solid rgb(${color().r}, ${color().g}, ${color().b});
                    }
                `}
            </style>
        </div>
    );
}

export default Component;
