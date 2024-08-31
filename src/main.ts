import { Plugin } from 'obsidian';

import { Settings } from './settings';
import { SettingsTab } from './ui/settingsWindow';
import { CodeMaps } from './mapper/codeMaps';

import ObsidianRenderer from './ui/obsidianRenderer';
import { CmRendererPlugin } from './ui/cmRenderer';
import { InputSuggester } from './ui/inputSuggester';
import { TextProcessor } from './mapper/textProcessor';

export default class TokenzPlugin extends Plugin
{
    override async onload()
    {
        // load core plugin modules
        await this.loadSettings();
        const codeMaps = new CodeMaps();
        codeMaps.loadAll(this.app);
        this.addSettingTab(new SettingsTab(this.app, this, this.saveSettings.bind(this), Settings.instance));

        // load UI modules
        TextProcessor.instance.codeMaps = codeMaps;
        this.registerEditorExtension(CmRendererPlugin.build());
        this.registerMarkdownPostProcessor(ObsidianRenderer.processTokens);
        this.registerEditorSuggest(new InputSuggester(this, codeMaps));

        console.log('Tokenz loaded!');
    }

    override onunload(): void
    {
        console.log('Tokenz unloaded!');
    }

    async loadSettings() {
        Settings.instance = { ...Settings.instance, ...await this.loadData() };
    }

    async saveSettings() {
        await this.saveData(Settings.instance);
    }
}
