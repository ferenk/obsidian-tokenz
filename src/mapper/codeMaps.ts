import { App, FileSystemAdapter } from 'obsidian';
import { StringUtils } from '../common/StringUtils';

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
                console.log(`file: ${StringUtils.jsonStringifyCircular(fileName)}`);
                if (fileName.endsWith('.json'))
                {
                    const filePath = path.resolve(pluginDataDir, fileName);

                    const fileContents = fs.readFileSync(filePath, 'utf8');
                    // console.log(`READ: ${fileContents}`);
                    try
                    {
                        const fileJsonObj = JSON.parse(fileContents);
                        console.log(`Map from file "${fileName}" loaded`);
                        for (const code of Object.keys(fileJsonObj))
                        {
                            const value = fileJsonObj[code];
                            if (typeof value === 'object' && value.constructor.name === 'Array')
                                fileJsonObj[code] = value[0];
                        }
                        this.codeMaps.push(fileJsonObj);
                        // console.log(`Parsed JSON: ${StringUtils.JSON_stringify_circular(fileJson)}`);
                    } catch (e)
                    {
                        console.log(`Exception while loading JSON while loading file "${fileName}": ${e}`);
                    }
                }
            }
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

    public filterValuesAll(predicateCB: Function)
    {
        const allValues: string[] = [];
        for (const map of this.codeMaps)
        {
            // @ts-ignore:next-line
            const value = Object.keys(map).filter(predicateCB);
            allValues.push(...value);
        }
        return allValues;
    }
}
