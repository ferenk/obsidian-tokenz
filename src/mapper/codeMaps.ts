import { App } from 'obsidian';

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

    public filterValuesAll(predicateCB: (text: string) => boolean)
    {
        const allValues: string[] = [];
        for (const map of this.codeMaps)
        {
            const value = Object.keys(map).filter(predicateCB);
            if (value.length > 10)
            {
                allValues.push(...value.slice(0, 10));
                break;
            } else
                allValues.push(...value);
        }
        return allValues;
    }
}
