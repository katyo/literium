/*
Language: HTML, XML
Category: common
*/

import { LanguageDef } from '../types';
import { COMMENT } from '../common';

const XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';

const TAG_INTERNALS = {
    endsWithParent: true,
    illegal: /</,
    relevance: 0,
    contains: [
        {
            className: 'attr',
            begin: XML_IDENT_RE,
            relevance: 0
        },
        {
            begin: /=\s*/,
            relevance: 0,
            contains: [
                {
                    className: 'string',
                    endsParent: true,
                    variants: [
                        { begin: /"/, end: /"/ },
                        { begin: /'/, end: /'/ },
                        { begin: /[^\s"'=<>`]+/ }
                    ]
                }
            ]
        }
    ]
};

export const XML: LanguageDef = {
    name: 'xml',
    aliases: ['html', 'xhtml', 'rss', 'atom', 'xjb', 'xsd', 'xsl', 'plist'],
    case_insensitive: true,
    contains: [
        {
            className: 'meta',
            begin: '<!DOCTYPE', end: '>',
            relevance: 10,
            contains: [{ begin: '\\[', end: '\\]' }]
        },
        COMMENT(
            '<!--',
            '-->',
            {
                relevance: 10
            }
        ),
        {
            begin: '<\\!\\[CDATA\\[', end: '\\]\\]>',
            relevance: 10
        },
        {
            className: 'meta',
            begin: /<\?xml/, end: /\?>/, relevance: 10
        },
        {
            begin: /<\?(php)?/, end: /\?>/,
            subLanguage: 'php',
            contains: [{ begin: '/\\*', end: '\\*/', skip: true }]
        },
        {
            className: 'tag',
            /*
            The lookahead pattern (?=...) ensures that 'begin' only matches
            '<style' as a single word, followed by a whitespace or an
            ending braket. The '$' is needed for the lexeme to be recognized
            by subMode() that tests lexemes outside the stream.
            */
            begin: '<style(?=\\s|>|$)', end: '>',
            keywords: { name: 'style' },
            contains: [TAG_INTERNALS],
            starts: {
                end: '</style>', returnEnd: true,
                subLanguage: ['css', 'xml']
            }
        },
        {
            className: 'tag',
            // See the comment in the <style tag about the lookahead pattern
            begin: '<script(?=\\s|>|$)', end: '>',
            keywords: { name: 'script' },
            contains: [TAG_INTERNALS],
            starts: {
                end: '\<\/script\>', returnEnd: true,
                subLanguage: ['actionscript', 'javascript', 'handlebars', 'xml']
            }
        },
        {
            className: 'tag',
            begin: '</?', end: '/?>',
            contains: [
                {
                    className: 'name', begin: /[^\/><\s]+/, relevance: 0
                },
                TAG_INTERNALS
            ]
        }
    ]
};
