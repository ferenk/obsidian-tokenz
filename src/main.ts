import { Plugin, Notice, setTooltip } from 'obsidian';

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
        const codeMaps = new CodeMaps(this);
        codeMaps.loadAll(this.app);
        this.addSettingTab(new SettingsTab(this.app, this, this.saveSettings.bind(this), Settings.instance));

        // load UI modules
        TextProcessor.instance.codeMaps = codeMaps;
        this.registerEditorExtension(CmRendererPlugin.build());
        this.registerMarkdownPostProcessor(ObsidianRenderer.processTokens);
        this.registerEditorSuggest(new InputSuggester(this, codeMaps));
        this.initStatusBar();

        console.log('Tokenz loaded!');
    }

    statusBarItemEl: HTMLElement | null = null;
    initStatusBar()
    {
        this.statusBarItemEl = this.addStatusBarItem();
        this.statusBarItemEl.addEventListener(
            'click', () =>
        {
            this.refreshStatusBar(!Settings.instance.bSuggestReplaceTokens);
            this.saveSettings();
        });
        this.refreshStatusBar();

		// Command: to change the way the item is inserted
        this.addCommand({
            id: 'tokenz-selected-icon-insert-mode',
            name: 'Change how the selected item is inserted (symbol or short code)',
            callback: () =>
            {
                this.refreshStatusBar(!Settings.instance.bSuggestReplaceTokens);
                this.saveSettings();
            },
        });
    }

    refreshStatusBar(suggestReplaceTokens?: boolean)
    {
        if (suggestReplaceTokens !== undefined)
        {
            Settings.instance.bSuggestReplaceTokens = suggestReplaceTokens;
            new Notice(`Tokenz: suggestions now insert ${suggestReplaceTokens ? 'symbols 🙂' : 'short codes :-)'}`);
        }

        if (this.statusBarItemEl == null)
        {
            new Notice(`Error: Status bar update failed!'}`);
            return;
        }

        const bReplace = Settings.instance.bSuggestReplaceTokens;

        const msgReplaceMode = bReplace  ? 'T 🙂' : 'T :-)';
        this.statusBarItemEl.setText(msgReplaceMode);

        const msgReplaceModeLong  = 'Tokenz: Insert mode: ' + (bReplace  ? '🙂 symbol' : ':-) short code');
        setTooltip(this.statusBarItemEl, msgReplaceModeLong);
    }

    override onunload(): void
    {
        console.log('Tokenz unloaded!');
    }

    async loadSettings() {
        Settings.instance = { ...Settings.instance, ...await this.loadData() };
    }

    saveSettingsCounter = 0;
    async saveSettings()
    {
        await this.saveData(Settings.instance);
        console.log(`Tokenz: Settings #${++this.saveSettingsCounter} saved.`);
        this.refreshStatusBar();
    }
}
