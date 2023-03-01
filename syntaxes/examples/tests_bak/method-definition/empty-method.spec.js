const
    { assert, expect } = require('chai');
const shared = require('../shared.js');

describe('', () => {
    let statement = `method private logical MethodName(input var1 as character):
end method.`;

    let expectedTokens = [
        [
            { "startIndex": 0, "endIndex": 6, "scopes": ["source.abl", "meta.method.abl", "meta.method.abl"] },
            { "startIndex": 6, "endIndex": 7, "scopes": ["source.abl", "meta.method.abl"] },
            { "startIndex": 7, "endIndex": 14, "scopes": ["source.abl", "meta.method.abl", "meta.method.accessmodifier.abl"] },
            { "startIndex": 14, "endIndex": 15, "scopes": ["source.abl", "meta.method.abl"] },
            { "startIndex": 15, "endIndex": 22, "scopes": ["source.abl", "meta.method.abl", "meta.method.returntype.abl"] },
            { "startIndex": 22, "endIndex": 23, "scopes": ["source.abl", "meta.method.abl"] },
            { "startIndex": 23, "endIndex": 33, "scopes": ["source.abl", "meta.method.abl", "entity.name.function.abl"] },
            { "startIndex": 33, "endIndex": 58, "scopes": ["source.abl", "meta.method.abl"] },
            { "startIndex": 58, "endIndex": 59, "scopes": ["source.abl", "meta.method.abl", "meta.method.body.abl"] }
        ], [
            { "startIndex": 0, "endIndex": 10, "scopes": ["source.abl", "meta.method.abl", "meta.method.body.abl", "keyword.group.abl"] },
            { "startIndex": 10, "endIndex": 11, "scopes": ["source.abl", "punctuation.terminator.abl"] }]
    ];
    shared.itShouldMatchExpectedScopes(statement, expectedTokens);
})
