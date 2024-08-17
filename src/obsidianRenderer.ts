import
{
    MarkdownPostProcessor,
} from "obsidian";

import
{
    TextProcessor,
} from "./textProcessor";

export default class ObsidianRenderer {
    static readonly textProcessor: TextProcessor = new TextProcessor();
    //public readonly view: EditorView;

    static readonly processTokens: MarkdownPostProcessor = (el: HTMLElement) =>
    {
        this.processTokensForNode(el);
    }

    static processTokensForNode(el: HTMLElement)
    {
        if ((typeof el.tagName === "string") && (el.tagName.indexOf("CODE") !== -1 || el.tagName.indexOf("MJX") !== -1))
        {
            return;
        }

        if (el.hasChildNodes())
        {
            el.childNodes.forEach((child: ChildNode) =>
            {
                ObsidianRenderer.processTokensForNode(child as HTMLElement);
            });
        }
        else
        {
            const strText = el.textContent;
            if (strText)
                el.textContent = this.textProcessor.processAllTokens(strText, null, this.decorateWithReplaceCB);
        }
    }

    static decorateWithReplaceCB(allText: string, range: [number, number], decoration: string | null): string | null
    {
        return allText.substring(0, range[0]) + decoration + allText.substring(range[1]+1);
    }
}