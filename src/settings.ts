export class Settings
{
    static #instance: Settings;     // nosonar, singleton pattern

    private constructor() { }
    public static get instance(): Settings
    {
        if (!Settings.#instance)
        {
            Settings.#instance = new Settings();
        }
        return Settings.#instance;
    }
    public static set instance(instance: Settings)
    {
        Settings.#instance = instance;
    }

    bSuggestions = true;
    bSuggestReplaceTokens = false;
    nSuggestLimit = 30;
    strEditorHighlightMode = 'completion';
    strSuggestionSeparator = '--------';
    bHighlightMainTokens = true;
    strHighlightCodeBlocks = 'enabled';
    strHighlightCodeBlocksCustom = '+*';
    strHighlightCodeBlocksSelected = '+*';
}
