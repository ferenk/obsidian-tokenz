import { App } from 'obsidian';

import { Settings } from '../settings';
import { emoticons } from '../../data/emoticons';
import { smileys } from '../../data/smileys';

export class CodeMaps
{
    public codeMaps: Object[] = [];

    public async loadAll(app: App)
    {
        // handle/replace array values (only using the first item)
        for (const code of Object.keys(smileys))
        {
            const value = smileys[code];
            if (typeof value === 'object' && value.constructor.name === 'Array')
                smileys[code] = value[0];
        }

        this.codeMaps.push(smileys);
        this.codeMaps.push(emoticons);
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
