import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { Settings } from '../settings';

export class SettingsTab extends PluginSettingTab
{
    plugin: Plugin;
    saveSettings: () => Promise<void>;

    constructor(app: App, plugin: Plugin, saveSettings: () => Promise<void>, settings: Settings)
    {
        super(app, plugin);
        this.plugin = plugin;
        this.saveSettings = saveSettings;
    }

    display(): void
    {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h1", { text: 'Tokenz Fun plugin settings' });
        containerEl.createEl("div", { text: 'Insert tokens/shorts codes/shorts anywhere in you documents with ease!' });

        containerEl.createEl("h3", { text: 'Suggestions' });
        new Setting(containerEl)
            .setName('Show suggestions')
            .setDesc('While typing: If enabled, a dropdown list will appear ' +
                'showing the actually matching tokens, if there\'s any. (Doesn\'t work on mobile)')
            .addToggle((toggle) => toggle
                .setValue(Settings.instance.bSuggestions)
                .onChange(async (value: boolean) =>
                {
                    Settings.instance.bSuggestions = value;
                    await this.saveSettings();
                    this.display();
                }));

        const settingSuggestionsReplace = new Setting(containerEl)
            .setName('Replace tokens with icons')
            .setDisabled(!Settings.instance.bSuggestions);
        if (Settings.instance.bSuggestions)
            settingSuggestionsReplace
                .setDesc('Replace the selected token with its matching icon. If enabled, the choosed token\'s icon ' +
                    'will be inserted directly into the text instead of the the token\'s name.')
                .addToggle((toggle) => toggle
                    .setValue(Settings.instance.bSuggestReplaceTokens)
                    .onChange(async (value: boolean) =>
                    {
                        Settings.instance.bSuggestReplaceTokens = value;
                        await this.saveSettings();
                    }));
        else
            settingSuggestionsReplace
                .setClass('tz-settings-disabled')
                .setDesc('Only available when "Show suggestions dropdown list" is enabled');

        const settingSuggestionsLimit = new Setting(containerEl)
            .setName('Limit number of suggested tokens')
            .setDisabled(!Settings.instance.bSuggestions);
        if (Settings.instance.bSuggestions)
            settingSuggestionsLimit
                .setDesc('Maximum number of suggestions to show in the dropdown list (per group; per code map)')
                .addSlider((slider) => slider
                    .setValue(Settings.instance.nSuggestLimit)
                    .setDynamicTooltip()
                    .setLimits(1, 100, 1)
                    .onChange(async (value: number) =>
                    {
                        Settings.instance.nSuggestLimit = value;
                        await this.saveSettings();
                    }));
        else
            settingSuggestionsLimit
                .setClass('tz-settings-disabled')
                .setDesc('Only available when "Show suggestions dropdown list" is enabled');

        containerEl.createEl("h3", { text: 'Editing' });
        let currentModeDesc = 'Disabled: No highlighting';
        switch (Settings.instance.strEditorHighlightMode)
        {
            case 'flexible': currentModeDesc = 'Flexible: Highlight if the current word is part of a token. E.g. "mile" matches ":smile:"'; break;
            case 'completion': currentModeDesc = 'Completion (Suggested): Highlight if the current word is the beginning of a token. E.g. ":smi" matches ":smile:"'; break;
            case 'strict': currentModeDesc = 'Strict: Highlight if the current word is a complete token. E.g. ":smile:" matches ":smile:"'; break;
        }
        new Setting(containerEl)
            .setName('Current word\'s highlighting mode')
            .setDesc(currentModeDesc)
            .addDropdown((dropdown) => dropdown
                .addOptions({
                    'flexible': 'Flexible mode',
                    'completion': 'Completion mode',
                    'strict': 'Strict mode',
                    'disabled': 'Disabled',
                })
                .setValue(Settings.instance.strEditorHighlightMode)
                .onChange(async (value: string) =>
                {
                    Settings.instance.strEditorHighlightMode = value;
                    await this.saveSettings();
                    this.display();
                }));
    }
}
