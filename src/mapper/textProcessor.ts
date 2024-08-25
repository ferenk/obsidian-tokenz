import { CodeMaps } from './codeMapsTs';
import { Settings } from '../settings';

type Selection = [number, number] | null;
type DecorateCB = (allText: string, range: [number, number], replacement: string | null, matchType: InputMatchType) => string | null;

export enum InputMatchType
{
    None = 0,
    Partial = 1,
    PartialFromBeginning = 2,
    Full = 4
}

export  class TextProcessor
{
    static #instance: TextProcessor;    // nosonar
    // @ts-ignore next-line
    codeMaps: CodeMaps;

    private constructor() { }

    public static get instance()
    {
        if (!TextProcessor.#instance)
        {
            TextProcessor.#instance = new TextProcessor();
        }

        return TextProcessor.#instance;
    }

    public setCodeMaps(codeMaps: CodeMaps)
    {
        this.codeMaps = codeMaps;
    }

    processAllTokens(text: string, selection: Selection, decorateCB: DecorateCB) {
        const origText = text;
        let tokenBeg = -1, wasWS = true, i = -1;
        while (++i <= text.length)
        {
            const isWS = (i === text.length || text[i] === ' ' || text[i] === '\t' || text[i] === '\r' || text[i] === '\n');
            if (wasWS && !isWS)
                tokenBeg = i;
            else if (tokenBeg >= 0 && isWS)
            {
                const processResult = this.processOneToken(text, [tokenBeg, i - 1], selection, decorateCB);
                if (processResult)
                {
                    i += processResult.length - text.length;
                    text = processResult;
                }
                tokenBeg = -1;
            }
            wasWS = isWS;
        }
        if (text !== origText)
            console.log(`plugin tokenz: Text changed, ${origText}\r\n=>\r\n${text}`)
        return text;
    }

    processOneToken(text: string, match: [number, number], selection: [number, number] | null, decorateCB: DecorateCB): string | null
    {
        // debug console.log(`Token! [${match[0]}, ${match[1]}]`);
        const word = text.substring(match[0], match[1]+1);
        const replacedText = this.codeMaps.getValueAll(word);
        const smileyEnd = match[1];
        const smileyStart = match[0];

        const overlap = this.doRangesOverlap(match, selection);

        if (overlap)
        {
            let matchType = InputMatchType.None;
            switch (Settings.instance.strEditorHighlightMode)
            {
                case 'flexible':    // nosonar, break intentionally omitted
                    if (this.codeMaps.filterValuesAll((p: string) => p.includes(word)).length > 0)
                        matchType |= InputMatchType.Partial;
                case 'completion':  // nosonar, break intentionally omitted
                    if (this.codeMaps.filterValuesAll((p: string) => p.startsWith(word)).length > 0)
                        matchType |= InputMatchType.PartialFromBeginning;
                case 'strict':
                    if (this.codeMaps.filterValuesAll((p: string) => p === word).length > 0)
                        matchType |= InputMatchType.Full;
            }

            return (matchType ? decorateCB(text, [smileyStart, smileyEnd], null, matchType) : null);
        }
        else if (replacedText)
        {
            return decorateCB(text, [smileyStart, smileyEnd], replacedText, InputMatchType.Full);
        }
        return null;
    }

    doRangesOverlap(match: [number, number], selection: [number, number] | null)
    {
        let overlap = false;
        const smileyEnd = match[1];
        const smileyStart = match[0];

        if (selection)
        {
            // smiley's whole range is NOT within the current selection (start & end pos are both outside)
            overlap ||= selection[0] <= smileyStart && smileyStart <= selection[1];
            overlap ||= selection[0] <= smileyEnd && smileyEnd <= selection[1];
            overlap ||= smileyStart <= selection[0] && selection[0] <= smileyEnd + 1;
            overlap ||= smileyStart <= selection[1] && selection[1] <= smileyEnd;
            // debug console.log(`cursor/selection: [${selection[0]}, ${selection[1]}], smiley: [${smileyStart}, ${smileyEnd}], decorate: ${decorate}`);
        }

        return overlap;
    }
}
