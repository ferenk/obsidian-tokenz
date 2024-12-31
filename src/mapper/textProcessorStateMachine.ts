export enum CharParseState
{
    Any,                    // any character
    NormalWS,               // this line has only whitespaces so far
    NormalNonWS,            // this line had at least one non-whitespace character
    StartEndMatching,
    BlockStart1,
    BlockStart2,
    BlockStartWS,
    BlockStartTitleNonWS,
    BlockStartNonWS,
}

export enum BlockParseState
{
    InBlock,
    OutBlock,
}

export class TextProcessorStateMachine
{
    // @ts-ignore
    charParseState: CharParseState;
    // @ts-ignore
    blockParseState: BlockParseState;
    // @ts-ignore
    blockName: string;
    // @ts-ignore
    private blockNameTemp: string;

    constructor()
    {
        this.restart();
    }

    /**
     * "Soft" reset: Put the state's states machine back to the starting states
     */
    restart()
    {
        this.charParseState = CharParseState.NormalWS;
        this.blockParseState = BlockParseState.OutBlock;
        this.blockName = '';
        this.blockNameTemp = '';
    }

    private static readonly blockMarkerSM = [
        ['\r',  CharParseState.Any,                  CharParseState.NormalWS],
        ['\n',  CharParseState.Any,                  CharParseState.NormalWS],
        ['`',   CharParseState.NormalWS,             CharParseState.BlockStart1],
        ['`',   CharParseState.BlockStart1,          CharParseState.BlockStart2],
        ['`',   CharParseState.BlockStart2,          CharParseState.BlockStartWS],
        ['\\S', CharParseState.BlockStartWS,         CharParseState.BlockStartTitleNonWS],
        ['\\s', CharParseState.BlockStartTitleNonWS, CharParseState.BlockStartNonWS],
        ['\\S', CharParseState.NormalWS,             CharParseState.NormalNonWS],
    ];

    private static readonly blockSM = [
        ['\r', CharParseState.BlockStartWS,         BlockParseState.OutBlock, BlockParseState.InBlock],
        ['\n', CharParseState.BlockStartWS,         BlockParseState.OutBlock, BlockParseState.InBlock],
        ['\r', CharParseState.BlockStartWS,         BlockParseState.InBlock,  BlockParseState.OutBlock],
        ['\n', CharParseState.BlockStartWS,         BlockParseState.InBlock,  BlockParseState.OutBlock],
        ['\r', CharParseState.BlockStartNonWS,      BlockParseState.OutBlock, BlockParseState.InBlock],
        ['\n', CharParseState.BlockStartNonWS,      BlockParseState.OutBlock, BlockParseState.InBlock],
        ['\r', CharParseState.BlockStartTitleNonWS, BlockParseState.OutBlock, BlockParseState.InBlock],
        ['\n', CharParseState.BlockStartTitleNonWS, BlockParseState.OutBlock, BlockParseState.InBlock],
        // [BlockStartNonWS, InBlock] -/-> OutBlock | No transition, because BlockStartNonWS(Title) can only start a block
    ];

    detectCodeBlocks(nextCh: string, isWS: boolean): void
    {
        // block level state machine (applies state change before the char level state change)
        for(const rule of TextProcessorStateMachine.blockSM)
        {
            if (rule[0] === nextCh && rule[1] === this.charParseState && rule[2] === this.blockParseState)
            {
                const blockParseStateNew = rule[3] as BlockParseState;

                // store the final block name
                if (this.blockParseState === BlockParseState.OutBlock && blockParseStateNew === BlockParseState.InBlock)
                {
                    this.blockName = this.blockNameTemp;
                    this.blockNameTemp = '';
                }
                if (this.blockParseState === BlockParseState.InBlock && blockParseStateNew === BlockParseState.OutBlock)
                {
                    this.blockName = this.blockNameTemp = '';
                }

                // do the block level state change
                this.blockParseState = blockParseStateNew;
                break;
            }
        }

        // char level state machine
        for(const rule of TextProcessorStateMachine.blockMarkerSM)
        {
            // match state
            if (rule[1] !== CharParseState.Any && rule[1] !== this.charParseState)
                continue;
            // match next character
            if (nextCh === rule[0] || (isWS && rule[0] === '\\s') || (!isWS && rule[0] === '\\S'))
            {
                this.charParseState = rule[2] as CharParseState;
                break;
            }
        }

        // store the current block name
        if (this.charParseState === CharParseState.BlockStartTitleNonWS)
        {
            this.blockNameTemp += nextCh;
        }
    }
}
