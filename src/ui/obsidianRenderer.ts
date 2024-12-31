import
{
    MarkdownPostProcessor,
} from "obsidian";

import
{
    TextProcessor,
} from "../mapper/textProcessor";

export default class ObsidianRenderer
{
    static readonly processTokens: MarkdownPostProcessor = (el: HTMLElement) =>
    {
        this.processTokensForNode(el);
    }

    static processTokensForNode(el: HTMLElement)
    {
        console.log(`processTokensForNode, el.tagName: ${el.tagName}`);
        if ((typeof el.tagName === "string") && (el.tagName.indexOf("CODE") !== -1 || el.tagName.indexOf("MJX") !== -1))
        {
            console.log(`Skipping code block ${el.tagName}`);
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
                el.textContent = TextProcessor.instance.processAllBlockTokens(
                    strText,
                    this.decorateWithReplaceCB);
        }
    }

    static decorateWithReplaceCB(allText: string, range: [number, number], decoration: string | null): string | null
    {
        return (decoration ? allText.substring(0, range[0]) + decoration + allText.substring(range[1]+1) : null);
    }
}
