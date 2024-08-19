import { App, FileSystemAdapter } from 'obsidian';

import fs from 'fs';
import path from 'path';

export class CodeMaps
{
    public codeMaps: Object[] = [];

    public loadAll(app: App)
    {
        const adapter = app.vault.adapter;
        if (adapter instanceof FileSystemAdapter)
        {
            const pluginDataDir = path.resolve(adapter.getBasePath(), '.obsidian', 'plugins', 'obsidian-tokenz', 'data');
            const filesList = fs.readdirSync(pluginDataDir);
            for(const fileName of filesList)
            {
                if (fileName.endsWith('.json'))
                {
                    this.loadCodeMap(pluginDataDir, fileName);
                }
            }
        }
    }

    private loadCodeMap(pluginDataDir: string, fileName: string)
    {
        const filePath = path.resolve(pluginDataDir, fileName);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        // debug console.log(`READ: ${fileContents}`);

        try
        {
            const fileJsonObj = JSON.parse(fileContents);
            console.log(`plugin tokenz: Map from file "${fileName}" loaded!`);
            for (const code of Object.keys(fileJsonObj))
            {
                const value = fileJsonObj[code];
                if (typeof value === 'object' && value.constructor.name === 'Array')
                    fileJsonObj[code] = value[0];
            }
            // debug console.log(`Parsed JSON: ${StringUtils.jsonStringifyCircular(fileJsonObj)}`);
            this.codeMaps.push(fileJsonObj);
        } catch (e)
        {
            console.error(`plugin tokenz: Exception while loading JSON while loading file "${fileName}": ${e}`);
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
