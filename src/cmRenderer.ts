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
    InputMatchType,
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

class CmRendererPlugin implements PluginValue
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

    addDecorationCB(builder: RangeSetBuilder<Decoration>, allText: string, range: [number, number], decoration: string | null, matchType: InputMatchType): string | null
    {
        // replace the token to the appropriate icon (or just highlight the code near to the cursor)
        if (decoration)
            builder.add(range[0], range[1] + 1, Decoration.replace({ widget: new TokenReplacerWidget(decoration) }));
        else if (matchType !== InputMatchType.None)
        {
            let textColor = '';
            if (matchType & InputMatchType.Full)
                textColor = 'hsl(42, 70%, 65%)';
            else if (matchType & InputMatchType.PartialFromBeginning)
                textColor = 'hsl(42, 55%, 55%)';
            else if (matchType & InputMatchType.Partial)
                textColor = 'hsl(42, 40%, 50%)';
            for (let i = 0; i < range[1] - range [0] + 1; i++)
                builder.add(range[0] + i, range[0] + i + 1, Decoration.replace({ widget: new TokenReplacerWidget(allText.substring(range[0] + i, range[0] + i + 1), textColor) }));
        }
        return null;
    }
}

const pluginSpec: PluginSpec<CmRendererPlugin> = {
    decorations: (value: CmRendererPlugin) => value.decorations,
};

export const cmRendererPlugin = ViewPlugin.fromClass(
    CmRendererPlugin,
    pluginSpec,
);
