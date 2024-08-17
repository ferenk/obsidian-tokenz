import { Plugin } from 'obsidian';

import ObsidianRenderer from './obsidianRenderer';
import { cmRendererPlugin } from './cmRenderer';

import { InputSuggester } from './inputSuggester';

export default class TokenzPlugin extends Plugin {
    override async onload() {
        this.registerEditorExtension(cmRendererPlugin);
        this.registerMarkdownPostProcessor(ObsidianRenderer.processTokens);
        this.registerEditorSuggest(new InputSuggester(this));
        console.log("Obsidian Tokenz loaded!");
    }
}
