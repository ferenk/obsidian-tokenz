import { Plugin, EditorSuggest, Editor, EditorPosition, TFile, EditorSuggestTriggerInfo, EditorSuggestContext } from 'obsidian';

import { CodeMaps } from '../mapper/codeMaps';
import { Settings } from '../settings';

export class InputSuggester extends EditorSuggest<string>
{
    codeMaps: CodeMaps;

    constructor(plugin: Plugin, codeMaps: CodeMaps) {
        super(plugin.app);
        this.codeMaps = codeMaps;
    }

    onTrigger(cursor: EditorPosition, editor: Editor, _: TFile): EditorSuggestTriggerInfo | null {
        if (Settings.instance.bSuggestions)
        {
            const lineBeg = editor.getLine(cursor.line).substring(0, cursor.ch);

            let i: number;
            for(i = lineBeg.length - 1; i >= 0; i--)
            {
                const isWS = (lineBeg[i] === ' ' || lineBeg[i] === '\t' || lineBeg[i] === '\r' || lineBeg[i] === '\n');
                if (isWS)
                    break;
            }
            const match = lineBeg.substring(i + 1);

            // get and show suggestions
            if (match && match.length >= 1)
            {
                const suggestions = this.getSuggestionsInternal(match);
                // debug console.log(`subStr match: ${match}, getSuggestionsInt: ${suggestions}`);

                if (suggestions.length > 0) {
                    return {
                        end: cursor,
                        start: {
                            ch: cursor.ch - match.length,
                            line: cursor.line,
                        },
                        query: match,
                    }
                }
            }
        }
        return null;
    }

    getSuggestions(context: EditorSuggestContext)
    {
        return this.getSuggestionsInternal(context.query);
    }

    getSuggestionsInternal(query: string)
    {
        return this.codeMaps.filterValuesAll((p: string) => p.includes(query));
    }

    renderSuggestion(suggestion: string, el: HTMLElement): void
    {
        const outer = el.createDiv({ cls: "tz-suggester-container" });
        const value = this.codeMaps.getValueAll(suggestion);
        outer.createDiv({ cls: "tz-key-shortcode" }).setText(suggestion);
        outer.createDiv({ cls: "tz-value-replacement" }).setText(value ?? '?');
    }

    selectSuggestion(suggestion: string): void {
        if (this.context)
        {
            const value = this.codeMaps.getValueAll(suggestion);
            this.context.editor.replaceRange(Settings.instance.bSuggestReplaceTokens ? value ?? '?' : `${suggestion} `, this.context.start, this.context.end);
        }
    }
}
