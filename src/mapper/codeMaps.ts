import { App, Plugin, normalizePath } from 'obsidian';

import { Settings } from '../settings';
import { emoticons } from '../../data/emoticons';
import { smileys } from '../../data/smileys';
// debug import { StringUtils } from 'src/common/StringUtils';

const MAPS_FILENAME = 'maps.lst';
const FILEDUMP_LENGTH = 200;

export class CodeMaps
{
    public codeMaps: Object[] = [];
    private readonly plugin: Plugin;

    public constructor(plugin: Plugin)
    {
        this.plugin = plugin;
    }

    public async loadAll(app: App)
    {
        this.loadAllFromCompiledData(app);
        await this.loadAllFromConfigFolder(app);
    }

    public loadAllFromCompiledData(app: App)
    {
        // all compiled data is already 'loaded', so there is no separate loading step
        // 'smileys' has array values to hold extra data about the icons, so we need to process them
        this.processComplexMapValues(smileys);

        this.codeMaps.push(smileys);
        this.codeMaps.push(emoticons);
    }

    public async loadAllFromConfigFolder(app: App)
    {
        // 1. load the mapsfile's list
        //  logging is disabled here (no 3rd param) as it's a common case that 'maps.lst' isn't there
        const listFileContents = await this.loadFile(app, MAPS_FILENAME);
        if (listFileContents && listFileContents.trim().length > 0)
        {
            // notify the user that he/she has put 'maps.lst' to the right place
            console.log('Tokenz: Code map list loaded, processing...');

            // 2. load all files listed in 'maps.lst'
            const fileNames = listFileContents.split(/\r?\n/);
            for (let i = 0; i < fileNames.length; i++)
            {
                if (fileNames[i].trim().length > 0)
                {
                    const loadResultMsgHeader = `Map file #${i + 1}: '${fileNames[i]}'`;
                    try
                    {
                        if (await this.loadCodeMap(app, fileNames[i]))
                            console.log(`Tokenz: ${loadResultMsgHeader} loaded`);
                    }
                    catch (e)
                    {
                        console.error(`${loadResultMsgHeader}: ${e}`);
                    }
                }
            }
        }
    }

    /**
     * Load and parse a code map file
     * @param app Obsidian app instance
     * @param fileName map file name
     * @returns the parsed JSON object if the file was loaded successfully, otherwise null
     * @throws SyntaxError if the JSON parsing fails
     */
    private async loadCodeMap(app: App, fileName: string)
    {
        // load the code map (and log errors as they are because of wrong file entries in 'maps.lst' made by the user)
        const codeMapsContents = await this.loadFile(app, fileName, true);
        if (codeMapsContents && codeMapsContents.trim().length > 0)
        {
            try
            {
                const fileJsonObj = JSON.parse(codeMapsContents);
                this.processComplexMapValues(fileJsonObj);

                this.codeMaps.push(fileJsonObj);
            }
            catch (e)
            {
                // rethrow the error with the file contents
                const fileDump = codeMapsContents.substring(0, FILEDUMP_LENGTH);
                throw new SyntaxError(
                    `Error parsing JSON: ${e}\r\n` +
                    `File contents (first ${FILEDUMP_LENGTH} chars):\r\n${fileDump}`);
            }
            return true;
        }
        return false;
    }

    private processComplexMapValues(mapObj: any)
    {
        // handle/replace array values (only using the first item)
        for (const code of Object.keys(mapObj))
        {
            const value = mapObj[code];
            if (typeof value === 'object' && value.constructor.name === 'Array')
                mapObj[code] = value[0];
        }
    }

    private async loadFile(app: App, fileName: string, logErrors = false)
    {
        const pluginConfigPath = this.plugin.manifest.dir;
        const filePath = normalizePath(`${pluginConfigPath}/data/${fileName}`);

        try
        {
            return await app.vault.adapter.read(filePath);
        } catch (e)
        {
            if (logErrors)
                console.error(`Error loading file: ${fileName}, ${e}`);
        }
        return null;
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
            const mapValuesToAdd: string[] = mapValuesFiltered.slice(0, Settings.instance.nSuggestLimit);
            allValues.push(...mapValuesToAdd);

            if (mapValuesToAdd.length > 0)
                addSeparator = true;
        }
        return allValues;
    }
}
