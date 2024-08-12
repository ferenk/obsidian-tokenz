import
{
    editorLivePreviewField,
} from 'obsidian';


import
{
    EditorView, WidgetType,
    Decoration,
    DecorationSet,
    PluginSpec,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";

import
{
    RangeSetBuilder,
} from "@codemirror/state";


import
{
    TextProcessor,
} from "./textProcessor";

class TokenReplacerWidget extends WidgetType
{
    finalText = '-';
    finalColor: string = '';

    constructor(text: string, color = '')
    {
        super();
        this.finalText = text;
        this.finalColor = color;
    }

    toDOM(view: EditorView): HTMLElement
    {
        const div = document.createElement("span");

        div.innerText = this.finalText;
        if (this.finalColor.length > 0)
            div.style.color = this.finalColor;

        return div;
    }
}

class EmojiListPlugin implements PluginValue
{
    decorations: DecorationSet;
    textProcessor: TextProcessor;
    //public readonly view: EditorView;

    constructor(view: EditorView)
    {
        this.textProcessor = new TextProcessor();
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate)
    {
        // Disable in the source mode
        if (!update.state.field(editorLivePreviewField))
            this.decorations = Decoration.none;
        else
            this.decorations = this.buildDecorations(update.view);
    }

    buildDecorations(view: EditorView): DecorationSet
    {
        const builder = new RangeSetBuilder<Decoration>();
        const text = view.state.doc;

        let selection: [number, number] | null = null;
        if (view.state.selection.ranges.length > 0)
        {
            selection =  [view.state.selection.ranges[0].from, view.state.selection.ranges[0].to];
        }

        this.textProcessor.processAllTokens(text.toString(), selection, this.addDecorationCB.bind(this, builder));

        return builder.finish();
    }

    addDecorationCB(builder: RangeSetBuilder<Decoration>, allText: string, range: [number, number], decoration: string | null): string | null
    {
        // replace the token to the appropriate icon (or just highlight the code near to the cursor)
        if (decoration)
            builder.add(range[0], range[1]+1, Decoration.replace({ widget: new TokenReplacerWidget(decoration) }));
        else
            builder.add(range[0], range[1]+1, Decoration.replace({ widget: new TokenReplacerWidget(allText.substring(range[0], range[1]+1), 'hsl(42, 70%, 50%)') }));
        return null;
    }
}

const pluginSpec: PluginSpec<EmojiListPlugin> = {
    decorations: (value: EmojiListPlugin) => value.decorations,
};

export const emojiListPlugin = ViewPlugin.fromClass(
    EmojiListPlugin,
    pluginSpec,
);
