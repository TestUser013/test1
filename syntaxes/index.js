const fs = require('fs');
const yaml = require('js-yaml');
const plist = require('plist');
const readline = require('readline');

'use strict';

const options = {
    groupedSource: './syntaxes/keywords.csv',
    openEdgeSource: './syntaxes/kwlist.txt',
    template: './syntaxes/oe-abl.tmLanguage.yaml',
    language: './syntaxes/oe-abl.tmLanguage.json',
    delimiter: ';',
    grammarOutput: '',
    defaultGroupName: 'other',
    limit: 400,
};

async function main() {
    const groupedKeywords = await readGroupedKeywords();
    const openEdgeKeywords = await readOpenEdgeKeywords();
    const keywords = removeDuplicates([...groupedKeywords, ...openEdgeKeywords]);
    const keywordsExt = generateAbbreviations(keywords);
    const groups = groupKeywords(keywordsExt);
    const grammar = generateGrammar(groups);
    generateLanguage(grammar);
}

async function readGroupedKeywords() {
    return readKeywordsMap(options.groupedSource, (keywords, line) => {
        const [ keyword, abbreviation, group ] = line.toLowerCase().split(options.delimiter);
        if (keyword) {
            keywords.push({
                source: options.groupedSource,
                keyword,
                group: group || options.defaultGroupName,
                abbreviation,
            });
        }
    });
}

async function readOpenEdgeKeywords() {
    return readKeywordsMap(options.openEdgeSource, (keywords, line) => {
        const [ , keywordsString ]= line = line.toLowerCase().split("=");
        keywordsString.split(" ").forEach((keyword) => {
            const [ abbreviation ] = keyword.split('(');
            keywords.push({
                source: options.openEdgeSource,
                keyword: keyword.replace('(', ''),
                group: options.defaultGroupName,
                abbreviation: abbreviation === keyword ? '' : abbreviation,
            });
        });
    });
}

async function readKeywordsMap(source, parseLineCallback) {
    return new Promise((resolve) => {
        const keywords = [];
        const lineReader = readline.createInterface({ input: fs.createReadStream(source) });
        lineReader.on('line', (line) => parseLineCallback(keywords, line));
        lineReader.on('close', () => resolve(keywords));
    });
}

function removeDuplicates(keywords) {
    const processed = new Set();
    const results = [];
    for (const keyword of keywords) {
        if (!processed.has(keyword.keyword)) {
            processed.add(keyword.keyword);
            results.push(keyword);
        }
    }
    return results;
}

function generateAbbreviations(keywords) {
    const keywordsExt = [];
    for (const keywordObject of keywords) {
        keywordsExt.push(keywordObject);
        if (keywordObject.abbreviation) {
            const remainingChars = keywordObject.keyword.substring(keywordObject.abbreviation);
            let suffix = '';
            for (const char of remainingChars) {
                keywordsExt.push({
                    source: keywordObject.source,
                    keyword: keywordObject.abbreviation + suffix,
                    group: `${keywordObject.group}.abbreviation`,
                    abbreviation: keywordObject.abbreviation,
                });
                suffix += char;
            }
        }
    }
    return keywordsExt;
}

function groupKeywords(keywords) {
    removeDuplicates(keywords);
    const groups = createKeywordGroup(keywords, (keyword) => keyword.group);
    const groupExt = regroupHugeGroups(groups);
    return groupExt;
}

function regroupHugeGroups(groups) {
    let groupExt = new Map();
    for (const[ key, group ] of groups.entries()) {
        if (group.size > options.limit) {
            const splittedGroups = createKeywordGroup([...group.values()], (keyword) => `${key}.${keyword.keyword[0]}`);
            groupExt = new Map([...groupExt, ...splittedGroups]);
        } else {
            groupExt.set(key, group);
        }
    }
    return groupExt;
}

function createKeywordGroup(keywords, defineGroupName) {
    return keywords.reduce((groupsObject, keywordObject) => {
        const groupName = defineGroupName(keywordObject);
        if (!groupsObject.has(groupName)) {
            groupsObject.set(groupName, new Map());
        }
        const group = groupsObject.get(groupName);
        if (group.has(keywordObject.keyword)) {
            console.log(`Duplicate keyword - [${keywordObject.group}] ${keywordObject.keyword}`);
        }
        group.set(keywordObject.keyword, keywordObject);
        return groupsObject;
    }, new Map());
}

function generateGrammarSection(key, group) {
    let match;
    const keywords = [...group.keys()].sort().join('|');
    if (['method', 'attribute'].indexOf(key) !== 0) { // add colon character for methods and attribute
        match = `:(?i)(?<![\\w-])(${keywords})(?![\\w-])`;
    } else {
        match = `(?i)(?<![\\w-])(${keywords})(?![\\w-])`;
    }
    return {
        match,
        // name: `keyword.group.abl`,
        name: `keyword.group.${key}.abl`,
    };
}

function generateGrammar(groups) {
    const grammar = {
        keywords: {
            patterns: [],
        },
    };
    for (const[ key, group ] of groups.entries()) {
        const name = `keywords-${key}`.replace(/\./g, '-');
        grammar.keywords.patterns.push({
            include: `#${name}`,
        });
        grammar[name] = generateGrammarSection(key, group);
    }
    return grammar;
}

function generateLanguage(grammar) {
    // fs.readFile(options.template, 'utf8', (error, tmLanguageTemplate) => {
    //     const tmLanguageKeywords = JSON
    //         .stringify(grammar, undefined, 4)
    //         .split('\n')
    //         .map((line) => `    ${line}`);
    //     tmLanguageKeywords.shift();
    //     tmLanguageKeywords.pop();
    //     const tmLanguage = tmLanguageTemplate.replace('        "keywords": {}', tmLanguageKeywords.join('\n'));
    //     fs.writeFileSync(options.language, tmLanguage);
    // });
    const inputText = fs.readFileSync(options.template, "utf8");
    const template = yaml.load(inputText);
    template.repository = Object.assign(template.repository, grammar);
    fs.writeFileSync(options.language, JSON.stringify(template, undefined, 4));
    // const outputText = plist.build(Object.assign(template, grammar));
    // fs.writeFileSync(options.language, outputText);

}

exports.main = main;
