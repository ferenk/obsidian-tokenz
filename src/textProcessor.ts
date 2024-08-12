import { smileyMap } from './smileyList';

type Selection = [number, number] | null;
type DecorateCB = (allText: string, range: [number, number], decoration: string | null) => string | null;

export  class TextProcessor
{
    //private readonly tokenRegExp = /\s(\S+)[\s"]/g;

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
            console.log(`Text changed: ${origText}\r\n=>\r\n${text}`)
        return text;
    }

    processOneToken(text: string, match: [number, number], selection: [number, number] | null, decorateCB: DecorateCB)
    {
        //!console.log(`Token! [${match[0]}, ${match[1]}]`);
        const word = text.substring(match[0], match[1]+1);
        const replacedText: string | undefined = smileyMap.get(word);
        if (replacedText)
        {
            const smileyEnd = match[1];
            const smileyStart = match[0];
            let decorate = true;
            if (selection)
            {
                // smiley's whole range is NOT within the current selection (start & end pos are both outside)
                decorate &&= !(selection[0] <= smileyStart && smileyStart <= selection[1]);
                decorate &&= !(selection[0] <= smileyEnd && smileyEnd <= selection[1]);
                decorate &&= !(smileyStart <= selection[0] && selection[0] <= smileyEnd +1);
                decorate &&= !(smileyStart <= selection[1] && selection[1] <= smileyEnd);
                //console.log(`cursor/selection: [${selection[0]}, ${selection[1]}], smiley: [${smileyStart}, ${smileyEnd}], decorate: ${decorate}`);
            }

            return decorateCB(text, [smileyStart, smileyEnd], (decorate ? replacedText : null));
        }
        return null;
    }
}
