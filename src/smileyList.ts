export const smileyList = JSON.parse(`{
    ":-)": "🙂",
    ":)": "🙂",
    ":-D": "😃",
    ":D": "😃",
    ":-(": "🙁",
    ":(": "🙁",
    ";-)": "😉",
    ";)": "😉"
}`);

export const smileyMap = new Map<string, string>(Object.entries(smileyList));