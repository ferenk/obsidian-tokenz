export class StringUtils
{
    public static jsonStringifyCircular(obj: any)
    {
        let cache: unknown[] | null = [];
        const stringified = JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache?.includes(value)) {
                    // Circular reference found, discard key
                    return '';
                }
                // Store value in our collection
                cache?.push(value);
            }
            return value;
        }, 4);
        cache = null;
        return stringified;
    }
}
