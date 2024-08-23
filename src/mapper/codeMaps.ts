import { App } from 'obsidian';

import { Settings } from '../settings';

export class CodeMaps
{
    public codeMaps: Object[] = [];

    public async loadAll(app: App)
    {
        this.loadFile(app, 'maps.lst', (listFileContents: string) =>
        {
            console.log(`plugin tokenz: Code maps list loaded, processing...`);
            const fileNames = listFileContents.split(/\r?\n/);
            for (let i = 0; i < fileNames.length; i++)
            {
                if (fileNames[i].trim().length > 0)
                {
                    console.log(`plugin tokenz: map #${i}: ${fileNames[i]}, loading...`);
                    this.loadCodeMap(app, fileNames[i]);
                }
            }
        });
    }

    private loadCodeMap(app: App, fileName: string)
    {
        const codeMapsRef = this.codeMaps;
        this.loadFile(app, fileName, (jsonMapFileContents) =>
        {
            const fileJsonObj = JSON.parse(jsonMapFileContents);

            // handle/replace values (only using the first item)
            for (const code of Object.keys(fileJsonObj))
            {
                const value = fileJsonObj[code];
                if (typeof value === 'object' && value.constructor.name === 'Array')
                    fileJsonObj[code] = value[0];
            }

            codeMapsRef.push(fileJsonObj);
        });
    }

    private async loadFile(app: App, fileName: string, cb: (fileName: string) => void)
    {
        const pluginDataDirRelative = `${app.vault.configDir}/plugins/obsidian-tokenz/data/${fileName}`;
        const pluginDataResourceDir = app.vault.adapter.getResourcePath(pluginDataDirRelative).toString();

        try
        {
            let blob = await fetch(pluginDataResourceDir).then(r => r.blob()).then(blobFile =>
            {
                const file = new File([blobFile], fileName);
                const reader = new FileReader();

                reader.onload = function ()
                {
                    console.log(`File: ${fileName} loaded!`);
                    cb(reader.result as string);
                };
                reader.readAsText(file);
            });
        } catch (e)
        {
            console.error(`plugin tokenz: Error loading file: ${fileName}, ${e}`);
        }
    }

    public getValueAll(key: string): string | null
    {
        for (const map of this.codeMaps)
        {
            // @ts-ignore:next-line
            const value = map[key];
            if (value)
                return value;
        }
        return null;
    }

    /**
     * Filter values for the input suggester and the syntax highlighter
     * @param predicateCB Filtering function
     * @returns List of the filtered strings
     */
    public filterValuesAll(predicateCB: (text: string) => boolean)
    {
        const allValues: string[] = [];
        let addSeparator = false;
        for (const map of this.codeMaps)
        {
            if (addSeparator)
            {
                allValues.push(Settings.instance.strSuggestionSeparator);
                addSeparator = false;
            }

            const mapValuesFiltered = Object.keys(map).filter(predicateCB);
            let mapValuesToAdd: string[] = mapValuesFiltered.slice(0, Settings.instance.nSuggestLimit);
            allValues.push(...mapValuesToAdd);

            if (mapValuesToAdd.length > 0)
                addSeparator = true;
        }
        return allValues;
    }
}
