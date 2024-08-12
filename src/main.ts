import { Plugin } from 'obsidian';
import ObsidianRenderer from './obsidianRenderer';

import { emojiListPlugin } from './cmRenderer';

export default class EmojiShortcodesPlugin extends Plugin {
    override async onload() {
        this.registerEditorExtension(emojiListPlugin);
        this.registerMarkdownPostProcessor(ObsidianRenderer.processTokens);
        console.log("Obsidian Tokenz loaded!");
    }
}
