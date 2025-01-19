import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { Settings } from '../settings';
import { TextProcessor } from 'src/mapper/textProcessor';

export class SettingsTab extends PluginSettingTab
{
    plugin: Plugin;
    saveSettings: () => Promise<void>;
    settings: Settings;

    constructor(app: App, plugin: Plugin, saveSettings: () => Promise<void>, settings: Settings)
    {
        super(app, plugin);
        this.plugin = plugin;
        this.saveSettings = saveSettings;
        this.settings = settings;
    }

    display(): void
    {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl).setName('Suggestions').setHeading();
        new Setting(containerEl)
            .setName('Show suggestions while typing')
            .setDesc('If enabled, a dropdown list will appear showing the actually matching tokens, if there\'s any.')
            .addToggle((toggle) => toggle
                .setValue(this.settings.bSuggestions)
                .onChange(async (value: boolean) =>
                {
                    this.settings.bSuggestions = value;
                    await this.saveSettings();
                    this.display();
                }));

        const settingSuggestionsReplace = new Setting(containerEl)
            .setName('Insert the icon of the selected token instead of its text')
            .setDisabled(!this.settings.bSuggestions);
        if (this.settings.bSuggestions)
            settingSuggestionsReplace
                .setDesc(
                createFragment(el => {
                        el.appendText(
                            'Insert the selected token\'s Unicode icon into your document. If disabled, insert the token\'s full text.',
                        );
                        el.createEl("br");
                        el.appendText(
                            'Note: This setting is also available on the status bar and the Command palette. Define a hotkey to switch more quickly!',
                        );
                    }),
                )
                .addToggle((toggle) => toggle
                    .setValue(this.settings.bSuggestReplaceTokens)
                    .onChange(async (value: boolean) =>
                    {
                        this.settings.bSuggestReplaceTokens = value;
                        await this.saveSettings();
                    }));
        else
            settingSuggestionsReplace
                .setClass('tz-settings-disabled')
                .setDesc('Only available when "Show suggestions dropdown list" is enabled');

        const settingSuggestionsLimit = new Setting(containerEl)
            .setName('Limit number of suggested tokens')
            .setDisabled(!this.settings.bSuggestions);
        if (this.settings.bSuggestions)
            settingSuggestionsLimit
                .setDesc('Maximum number of suggestions to show in the dropdown list (per group; per code map)')
                .addSlider((slider) => slider
                    .setValue(this.settings.nSuggestLimit)
                    .setDynamicTooltip()
                    .setLimits(1, 100, 1)
                    .onChange(async (value: number) =>
                    {
                        this.settings.nSuggestLimit = value;
                        await this.saveSettings();
                    }));
        else
            settingSuggestionsLimit
                .setClass('tz-settings-disabled')
                .setDesc('Only available when "Show suggestions dropdown list" is enabled');

        new Setting(containerEl).setName('Highlighting').setHeading()
            .setDesc('Highlight tokens in your documents by replacing them with their symbols on-the-fly, e.g 8-D -> 😎');
        new Setting(containerEl)
            .setName('- In the document\'s body')
            .setDesc('Highlight tokens throughout the document, except in code blocks.')
            .addToggle((toggle) => toggle
                .setValue(this.settings.bHighlightMainTokens)
                .onChange(async (value: boolean) =>
                {
                    this.settings.bHighlightMainTokens = value;
                    await this.saveSettings();
                    this.display();
                }));

        const defaultCodeBlockRules = new Map<string, string>([
            ['enabled', '+*'],
            ['enabled-only-unnamed', '-?*'],
            ['custom', '-?*'],
            ['disabled', '-*'],
        ]);

        const settingDesc: any = this.containerEl.createDiv('span');
        settingDesc.style.marginBlockStart = '0em';
        settingDesc.style.marginBlockEnd = '0em';
        settingDesc.setText('Highlight tokens in the clode blocks enclosed by ``` separators. For the format of the custom rules see ');
        settingDesc.appendChild(
                createEl('a', {
                    text: 'Settings / Highlighting',
                    href: 'https://obsidian-tokenz.ferenk.dev/#highlighting',
                }),
            );


        new Setting(containerEl)
            .setName('- In the code blocks')
            .setDesc(settingDesc)
            .addTextArea((text) =>
            {
                text
                    .setPlaceholder('Write your own custom rule here!')
                    .setDisabled(this.settings.strHighlightCodeBlocks !== 'custom')
                    .setValue(this.settings.strHighlightCodeBlocksSelected)
                    .onChange(async (value: string) =>
                    {
                        this.settings.strHighlightCodeBlocksCustom = value;
                        this.settings.strHighlightCodeBlocksSelected = value;
                        await this.saveSettings();
                        TextProcessor.instance.init();
                    });
                text.inputEl.style.opacity = this.settings.strHighlightCodeBlocks === 'custom' ? '1' : '0.5';
                // disable multi line input
                text.inputEl.rows = 1;
                text.inputEl.onkeydown = (event: KeyboardEvent) =>
                {
                    if (event.keyCode === 13) {
                        event.preventDefault();
                    }
                    text.inputEl.rows = 1;
                };
                return text;
            })
            .addDropdown((dropdown) => dropdown
                .addOptions({
                    'enabled': 'Enabled in all blocks',
                    'enabled-only-unnamed': 'Enabled in unnamed blocks',
                    'custom': 'Custom ruleset',
                    'disabled': 'Disabled in all blocks',
                })
                .setValue(this.settings.strHighlightCodeBlocks)
                .onChange(async (value: string) =>
                {
                    this.settings.strHighlightCodeBlocks = value;
                    if (value === 'custom')
                    {
                        this.settings.strHighlightCodeBlocksSelected = this.settings.strHighlightCodeBlocksCustom;
                    }
                    else
                    {
                        this.settings.strHighlightCodeBlocksSelected = defaultCodeBlockRules.get(value) ?? '-';
                    }
                    await this.saveSettings();
                    TextProcessor.instance.init();
                    this.display();
                    //console.log(`Tokenz: Custom setting: ${JSON.stringify(this.settings.strHighlightCodeBlocksCustom)}`);
                }),
            );

        new Setting(containerEl).setName('Editing').setHeading();
        let currentModeDesc = 'Disabled: No highlighting';
        switch (this.settings.strEditorHighlightMode)
        {
            case 'flexible': currentModeDesc = 'Flexible mode: Highlight if any part of a token is entered. E.g. "mile" matches ":smile:"'; break;
            case 'completion': currentModeDesc = 'Completion mode (Suggested): Highlight if the beginning of a token is entered. E.g. ":smi" matches ":smile:"'; break;
            case 'strict': currentModeDesc = 'Strict mode: Highlight if the current word is a complete token. E.g. ":smile:" matches ":smile:"'; break;
        }

        new Setting(containerEl)
            .setName('Highlight the currently edited word if it is probably a token.')
            .setDesc(currentModeDesc)
            .addDropdown((dropdown) => dropdown
                .addOptions({
                    'flexible': 'Flexible mode',
                    'completion': 'Completion mode',
                    'strict': 'Strict mode',
                    'disabled': 'Disabled',
                })
                .setValue(this.settings.strEditorHighlightMode)
                .onChange(async (value: string) =>
                {
                    this.settings.strEditorHighlightMode = value;
                    await this.saveSettings();
                    this.display();
                }));
    }
}
