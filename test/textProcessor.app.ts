import { TextProcessor } from "../src/mapper/textProcessor";
import { TextProcessorStateMachine, CharParseState, BlockParseState } from "../src/mapper/textProcessorStateMachine";

const inputMd = [
    'some random text with a :) smiley',
    '``` codeblox',
    'adfa',
    '``` not_a_new block!',
    'Still in codeblox...',
    '```   ',
    'another text with a :D smiley',
    '```',
    'Short block without a name',
    '```',
    '``` c#codes',
    'Inside the last code block :)',
    '```',
    'Last line',
];
function main()
{
    console.log('Text Processor State Machine test');
    const textProcSM = new TextProcessorStateMachine();
    const inputMdStr = inputMd.join('\r\n')
    console.log(`Input MD:\n--------\n${inputMd.join('\n')}\n--------\n\n`);

    let currBlockName = '';
    for(const ch of inputMdStr)
    {
        const isWS = (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n');
        textProcSM.detectCodeBlocks(ch, isWS);
        if (currBlockName !== textProcSM.blockName)
        {
            console.log(`Block name::: ${textProcSM.blockName}`);
        }
        currBlockName = textProcSM.blockName;

        const nextChState = textProcSM.charParseState;
        const nextChStateName = CharParseState[nextChState];
        const nextBlState = textProcSM.blockParseState;
        const nextBlStateName = BlockParseState[nextBlState];

        let chStr = ( ch === '\n' ? '\\n' : ch );
        chStr = ( chStr === '\r' ? '\\r' : chStr );
        console.log(`Process char: ${chStr} -> ${nextChStateName} (${nextBlStateName})`);
    }

    const ruleSets = ['-*,+code*', '-*,+*script*', '+*,-typescript', '-?*', '-*'];
    const blockNames = ['','javascript', 'typescript'];
    for (let i = 0; i < ruleSets.length; i++)
    {
        console.log(`\r\n\r\nRuleSet ${i}. '${ruleSets[i]}'`);
        TextProcessor.instance.init();
        for (let iRun = 1; iRun <= 2; iRun++)
        {
            console.log(`\r\nRun #${iRun}`);
            for (const blockName of blockNames)
            {
                console.log(`    BlockName: '${blockName}' -> ${TextProcessor.instance.isBlockAccepted(blockName, ruleSets[i])}`);
            }
        }
    }
}

main();
