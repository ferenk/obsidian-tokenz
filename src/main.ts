import { Plugin } from 'obsidian';

import { CodeMaps } from './mapper/codeMaps';
import ObsidianRenderer from './ui/obsidianRenderer';
import { CmRendererPlugin } from './ui/cmRenderer';
import { InputSuggester } from './ui/inputSuggester';
import { TextProcessor } from './mapper/textProcessor';

export default class TokenzPlugin extends Plugin
{
    override async onload() {
        const codeMaps = new CodeMaps();
        codeMaps.loadAll(this.app);
        TextProcessor.instance.codeMaps = codeMaps;
        this.registerEditorExtension(CmRendererPlugin.build());
        this.registerMarkdownPostProcessor(ObsidianRenderer.processTokens);
        this.registerEditorSuggest(new InputSuggester(this, codeMaps));
        console.log("plugin: Fun Tokenz loaded!");
    }
}
