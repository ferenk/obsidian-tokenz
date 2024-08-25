import { Plugin, EditorSuggest, Editor, EditorPosition, TFile, EditorSuggestTriggerInfo, EditorSuggestContext } from 'obsidian';

import { CodeMaps } from '../mapper/codeMapsTs';
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
            const line = editor.getLine(cursor.line);
            const wsSet = new Set([' ', '\t', '\r', '\n']);

            let beg: number, end: number;
            for (beg = cursor.ch - 1; beg >= 0; beg--)
                if (wsSet.has(line[beg]))
                    break;
            for (end = cursor.ch; end < line.length; end++)
                if (wsSet.has(line[end]))
                    break;

            // get and show suggestions
            if (beg + 1 < end)
            {
                const match = line.substring(beg + 1, end);
                const suggestions = this.getSuggestionsInternal(match);
                // debug console.log(`subStr match: ${match}, getSuggestionsInt: ${suggestions}`);

                if (suggestions.length > 0)
                {
                    // debug console.log(`plugin tokenz: Suggestions for ${match} (beg: ${beg}, end: ${end})...`);
                    return {
                        start: {
                            ch: beg + 1,
                            line: cursor.line,
                        },
                        end: {
                            ch: end,
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

    getSuggestionsInternal(word: string)
    {
        switch (Settings.instance.strEditorHighlightMode)
        {
            case 'flexible':
                return (this.codeMaps.filterValuesAll((p: string) => p.includes(word)));
            case 'completion':
            case 'strict':      // there no point in returning 'hits' only once with only one element...
                return (this.codeMaps.filterValuesAll((p: string) => p.startsWith(word)));
        }

        return this.codeMaps.filterValuesAll((p: string) => p.includes(word));
    }

    renderSuggestion(suggestion: string, el: HTMLElement): void
    {
        const outer = el.createDiv({ cls: "tz-suggester-container" });
        const value = this.codeMaps.getValueAll(suggestion);
        outer.createDiv({ cls: "tz-key-shortcode" }).setText(suggestion);
        outer.createDiv({ cls: "tz-value-replacement" }).setText(value ?? '');
    }

    selectSuggestion(suggestion: string): void {
        if (this.context)
        {
            const value = this.codeMaps.getValueAll(suggestion);
            if (suggestion != Settings.instance.strSuggestionSeparator)        // apply only when it's not a separator
            {
                const replaceStr = Settings.instance.bSuggestReplaceTokens ? value ?? '?' : suggestion + ' ';
                this.context.editor.replaceRange(replaceStr, this.context.start, this.context.end);
                this.context.editor.setCursor(this.context.start.line, this.context.start.ch + replaceStr.length);
            }
        }
    }
}
