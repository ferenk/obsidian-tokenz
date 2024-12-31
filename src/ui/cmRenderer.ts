import { Settings } from '../settings';

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
} from "../mapper/textProcessor";

class TokenReplacerWidget extends WidgetType
{
    text = '-';
    cls: string = '';

    constructor(text: string, cls = '')
    {
        super();
        this.text = text;
        this.cls = cls;
    }

    toDOM(view: EditorView): HTMLElement
    {
        const span = document.createElement('span');

        span.innerText = this.text;
        if (this.cls.length > 0)
        {
            span.classList.add(this.cls);
        }

        return span;
    }
}

export class CmRendererPlugin implements PluginValue
{
    decorations: DecorationSet;

    constructor(view: EditorView)
    {
        this.decorations = this.buildDecorations(view);
    }

    public static build()
    {
        const pluginSpec: PluginSpec<CmRendererPlugin> = {
            decorations: (value: CmRendererPlugin) => value.decorations,
        };

        return ViewPlugin.fromClass(
            CmRendererPlugin,
            pluginSpec,
        );
    }

    update(update: ViewUpdate)
    {
        //console.log(`update [ViewUpdate]: ${update.state.field(editorLivePreviewField)}`);
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

        TextProcessor.instance.restart();
        TextProcessor.instance.processAllTokens(
            text.toString(),
            Settings.instance.strHighlightCodeBlocksSelected,
            selection,
            this.addDecorationCB.bind(this, builder));

        return builder.finish();
    }

    addDecorationCB(builder: RangeSetBuilder<Decoration>, allText: string, range: [number, number], decoration: string | null, matchType: InputMatchType): string | null
    {
        // replace the token to the appropriate icon (or just highlight the code near to the cursor)
        if (decoration)
            builder.add(range[0], range[1] + 1, Decoration.replace({ widget: new TokenReplacerWidget(decoration) }));
        else if (matchType !== InputMatchType.None)
        {
            let textClass = '';
            if (matchType & InputMatchType.Full)
                textClass = 'tz-highlight1';
            else if (matchType & InputMatchType.PartialFromBeginning)
                textClass = 'tz-highlight2';
            else if (matchType & InputMatchType.Partial)
                textClass = 'tz-highlight3';
            for (let i = 0; i < range[1] - range [0] + 1; i++)
                builder.add(range[0] + i, range[0] + i + 1, Decoration.replace({ widget: new TokenReplacerWidget(allText.substring(range[0] + i, range[0] + i + 1), textClass) }));
        }
        return null;
    }
}
