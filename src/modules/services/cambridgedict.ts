import {TranslateTaskProcessor} from "../../utils/task";

const bar1 = "=========================";

function get_def(ele: HTMLElement | null): string[] {
    const translated: string[] = [];

    let usage = ele?.querySelector("span.dusage")?.textContent ?? "";
    const definision = ele?.querySelector("div.ddef_d")?.textContent ?? "null";
    usage = usage.length > 0 ? `[${usage}] ` : "";

    translated.push("\n| DEFINITION |")
    translated.push(`${usage}${definision}\n`);

    const expPart = ele?.querySelector("div.ddef_b");
    if (expPart != null) {
        translated.push("| EXAMPLES |");
        for (const exp of Array.from(expPart.querySelectorAll("div.examp"))) {
            let region = exp.querySelector("span.region")?.textContent ?? "";
            const gram = exp.querySelector("span.gram")?.textContent ?? "";
            const sentence = exp.querySelector("span.eg")?.textContent;

            region = region.length > 0 ? `[${region}]` : "";
            translated.push(`  + ${region}${gram} ${sentence}`);
        }
        translated.push("");
    }

    return translated;
}

function get_ancestor(
    node: HTMLElement | null | undefined,
    n: number,
): HTMLElement | null {
    let parent = node ?? null;
    for (let i = 0; i < n; i++) {
        if (parent == null) return null;
        parent = parent?.parentElement ?? null;
    }
    return parent;
}

function get_sense(title: string, node: HTMLElement | null | undefined): string {
    const match = node?.querySelector("h3.dsense_h")
        ?.textContent?.match(/\((.+)\)/) ?? [];
    return match.length >= 2 ? match[1] as string : "";
}

export default <TranslateTaskProcessor>async function (data) {
    const xhr = await Zotero.HTTP.request(
        "GET",
        `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(
            data.raw,
        )}`,
        {responseType: "text"},
    );
    if (xhr?.status !== 200) {
        throw `Request error: ${xhr?.status}`;
    }

    const res = xhr.response;
    const doc: Document = ztoolkit
        .getDOMParser()
        .parseFromString(res, "text/html");
    let translated: string[] = [];

    const dictPart = doc.body.querySelector("div.dictionary");
    const entryPart = dictPart?.querySelectorAll("div.entry-body__el") ?? [dictPart];

    const title = doc.body?.querySelector("div.di-title")?.textContent ?? "NOT FOUND";
    translated.push(`${title}`);

    for (const entry_body of Array.from(entryPart)) {
        const posgram = entry_body?.querySelector("div.posgram")?.textContent;
        const definisions = entry_body?.querySelectorAll("div.def-block") ?? [];

        for (const def_block of Array.from(definisions)) {
            if (!(def_block instanceof window.HTMLDivElement)) continue;

            const def_class_names = get_ancestor(def_block, 1)?.classList;

            translated.push(bar1);

            if (def_class_names?.contains("phrase-body")) {
                const sense = get_sense(title, get_ancestor(def_block, 4));
                const phrase = get_ancestor(def_block, 2)?.querySelector("span.phrase-title")
                    ?.textContent ?? "";

                translated.push(`| SPEECH OF PART | ${posgram}`);
                if (sense.length > 0) translated.push(`| SENSE | ${sense}`);
                translated.push(`| PHRASE | ${phrase}`);
                translated = translated.concat(get_def(def_block));
            } else {
                const sense = get_sense(title, get_ancestor(def_block, 2));

                translated.push(`| SPEECH OF PART | ${posgram}`);
                if (sense.length > 0) translated.push(`| SENSE | ${sense}`);
                translated = translated.concat(get_def(def_block));
            }
        }

        data.result = translated.join("\n");
    }

    data.result = translated.join("\n");
};
