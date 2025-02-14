import { Settings } from '../settings';

import { CodeMaps } from './codeMaps';
import { TextProcessorStateMachine, BlockParseState } from './textProcessorStateMachine';

export type Selection = [number, number] | null;
type DecorateCB = (allText: string, range: [number, number], replacement: string | null, matchType: InputMatchType) => string | null;

export enum InputMatchType
{
    None = 0,
    Partial = 1,
    PartialFromBeginning = 2,
    Full = 4
}

export class TextProcessor
{
    static #instance: TextProcessor;    // nosonar
    // @ts-ignore next-line
    codeMaps: CodeMaps;
    textProcessStateMachine = new TextProcessorStateMachine();
    // cached code block name set to speed up the block name matching
    // (block name matching is currently executed for every characters of a block!)
    codeBlockCache = new Map<string, boolean>();

    private constructor() { }

    public static get instance()
    {
        if (!TextProcessor.#instance)
        {
            TextProcessor.#instance = new TextProcessor();
        }

        return TextProcessor.#instance;
    }

    /**
     * "Hard" reset: Put everything back to its initial state (restart + clear the cache)
     */
    public init()
    {
        this.codeBlockCache.clear();
        this.restart();
    }

    /**
     * "Soft" reset: Prepares to process a new block
     */
    public restart()
    {
        this.textProcessStateMachine.restart();
    }

    public isBlockAccepted(blockName: string, blockNameRules: string): boolean
    {
        let accepted = this.isBlockAcceptedFromCache(blockName);

        // block is not in the cache -> execute the rules for this block (and store the result in the cache)
        if (accepted == null)
        {
            // process block name rules
            blockNameRules = blockNameRules.replace(/\*/g, '.*').replace(/\?/g, '.');
            accepted = true;
            // go rule by rule
            for (const rule of blockNameRules.split(','))
            {
                // remove the first character ('-' or '+')
                const ruleText = rule.trim();
                const blockNamePattern = `^${ruleText.substring(1)}$`;
                //console.log(`Processing rule!: '${rule}'-> '${blockNamePattern}', for string: '${blockName}'`);
                if (!(new RegExp(blockNamePattern).test(blockName)))
                    continue;
                // we found a match - is it a negative or a positive rule? apply it!
                accepted = ruleText.startsWith('+');
            }
            //console.log(`Block type '${blockName}' was not in the cache! Processed, accepted: ${accepted}`);
            // put the result into the cache
            this.codeBlockCache.set(blockName, accepted);
        }

        return accepted;
    }

    private isBlockAcceptedFromCache(blockName: string): boolean | null
    {
        const blockInCache = this.codeBlockCache.get(blockName);
        return blockInCache ?? null;
    }

    public setCodeMaps(codeMaps: CodeMaps)
    {
        this.codeMaps = codeMaps;
    }

    processAllBlockTokens(text: string, decorateCB: DecorateCB)
    {
        TextProcessor.instance.restart();
        return this.processAllTokens(text, null, null, decorateCB);
    }

    processAllTokens(text: string, blockNameRules: string | null, selection: Selection, decorateCB: DecorateCB) {
        let tokenBeg = -1, wasWS = true, i = -1;
        const parseSM = this.textProcessStateMachine;
        while (++i <= text.length)
        {
            const isWS = (i === text.length || text[i] === ' ' || text[i] === '\t' || text[i] === '\r' || text[i] === '\n');
            let bIsEnabledInBlock = true
            let bIsEnabledOutBlock = true;
            // parse code block if needed
            if (blockNameRules != null)
            {
                parseSM.detectCodeBlocks(text[i], isWS);
                bIsEnabledOutBlock = (parseSM.blockParseState === BlockParseState.OutBlock) && Settings.instance.bHighlightMainTokens;
                bIsEnabledInBlock = (parseSM.blockParseState === BlockParseState.InBlock) && this.isBlockAccepted(parseSM.blockName, blockNameRules);
            }
            if (wasWS && !isWS && (bIsEnabledOutBlock || bIsEnabledInBlock))
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
        // debug if (text !== origText)
        // debug     console.log(`Text changed, ${origText}\r\n=>\r\n${text}`)
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
