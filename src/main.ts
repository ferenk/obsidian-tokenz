import { Plugin, editorLivePreviewField } from 'obsidian';

import { smileyMap } from './smileyList';

export default class EmojiShortcodesPlugin extends Plugin {
	override async onload() {
        this.registerEditorExtension(emojiListPlugin);
	}
}

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
    //public readonly view: EditorView;

    constructor(view: EditorView)
    {
        console.log('EmojiList: created()');
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

        const tokenRegExp = /\s(\S+)\s/g;
        let match: RegExpExecArray | null = null;
        const strText = text.toString();
        while ((match = tokenRegExp.exec(strText)) !== null)
        {
            this.processToken(builder, view, tokenRegExp, match);
        }

        return builder.finish();
    }

    processToken(builder: RangeSetBuilder<Decoration>, view: EditorView, tokenRegExp: RegExp, match: RegExpMatchArray)
    {
        if (match.length > 1)
        {
            const word = match[1];
            const icon: string | undefined = smileyMap.get(word);
            if (icon)
            {
                console.log(`match: ${tokenRegExp.lastIndex - word.length}`);
                const endPos = tokenRegExp.lastIndex - 1;
                const startPos = endPos - word.length;
                let decorate = false;
                if (view.state.selection.ranges.length > 0)
                {
                    const sel = view.state.selection.ranges[0];
                    decorate = !(sel.from >= startPos && sel.to <= endPos);
                }

                // replace the token to the appropriate icon (or just highlight the code near to the cursor)
                if (decorate)
                    builder.add(startPos, endPos, Decoration.replace({ widget: new TokenReplacerWidget(icon) }));
                else
                    builder.add(startPos, endPos, Decoration.replace({ widget: new TokenReplacerWidget(word, 'hsl(42, 70%, 50%)') }));
            }
        }
        tokenRegExp.lastIndex--;
    }
}

const pluginSpec: PluginSpec<EmojiListPlugin> = {
    decorations: (value: EmojiListPlugin) => value.decorations,
};

const emojiListPlugin = ViewPlugin.fromClass(
    EmojiListPlugin,
    pluginSpec,
);
