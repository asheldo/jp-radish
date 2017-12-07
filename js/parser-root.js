// import * as clicks from './parser-root-links.js'; // TODO
import langsMap from './languages.js';

/**
 * Parse a Pokorny root into html
 */

const maxWords = 128, maxLemmas = 8, maxDefinitions = 128;

const greekRegEx = /((\b[Gg]r\.)|([Mm]aked\.)|([Pp]hryg\.))\s([^,\s]*)([,\s]*)/;
const greekRegExCount = greekRegEx.source.split("|").length;
const langRegEx = /((\b[Hh]itt\.)|(\b[Ll]it\.)|(\b[Aa]lb\.)|(\b[Rr]um\.)|([Ll]ett\.)|([Rr]uss\.)|([Ss]lav\.)|(čech\.)|([Ss]lov\.)|(\b[Hh]es\.)|(Old Church Slavic)|(Old Indian)|(\baisl\.)|(schwed\.)|(nhd\.)|(mhd\.)|(ahd\.)|([Gg]ot\.)|(\bas\.)|(\b[Ee]ngl\.)|(mengl\.)|(\bags\.)|([Gg]erm\.)|(air\.)|(mir\.)|(\b[Aa]rm\.)|([Ii]llyr\.)|([Cc]ymr\.)|([Mm]cymr\.)|(\bav\.)|([Aa]vest\.)|(ven\.-ill\.)|(\b[Ll]at\.)|(\b[Tt]och\. B)|(\b[Tt]och\. A))\s(\/[^\/]*\/)([,\s]*)/;
const langRegExCount = langRegEx.source.split("|").length;

const defRegEx = /((\s`[^<\.`]*')|(phonetic mutation))/;
const germanRegEx = /(German meaning:\*)( `.*')/;
const meaningRegEx = /(English meaning:\*)( [^\n]*)/;
const hrefRegEx = /(\bhttp[s]?:\/\/[^\s]*\b)[\s\.\,\)]/;

const lemmaRegEx = /(\*Root \/ lemma:[^\/]*)(\/[^`']*)(\s:\*\s`)/;
const idGroupRegEx = /\/([*]{0,1}[(]{0,1}[^(]{0,1}[)]{0,1}[^)]{0,1})/u;
// short versions
const firstRootRegEx = /\/([^/]{2,20})[,\/]{1}/;

/** parser-root-links */

export const keyClick =
    "onclick='linkKeywordLanguage(this)' href='javascript:void(0)' ";

export const    rootClick =
    "onclick='showUpdate(this.innerHTML, pieroot, roothistory)' href='javascript:void(0)'";

export const    definitionClick =
    "onclick='linkKeywordDefinition(this)' href='javascript:void(0)' ";

export function  langClick(langQuoted) { 
    return "<a href='javascript:void(0)' onclick='linkLanguage("
	+ langQuoted
	+ ",this)'>";
}

/****************************
 * Parse word and lemma links
 */
export function parseContent(root) {
    var contents = root;
    contents = parseGermanMeaning(contents, 0, germanRegEx);
    contents = parseDefinitions(contents, 0, meaningRegEx, 1, 2);
    contents = parseDefinitions(contents, 0, defRegEx, maxDefinitions, 1);
    contents = parseContentsAndLemmas(false, contents, 0);
    contents = parseContentsAndLemmas(true, contents, 0);
    contents = parseLinks(contents, 0, hrefRegEx, maxDefinitions,
			  0);
    const content = "<pre>" + contents + "</pre>";
    // console.log(root + "\n" + content);
    return content;
}

    function parseContentsAndLemmas(doGreek, root, level) {
	var content = "";
	var q = '"';
	var matchs = root.match(doGreek?greekRegEx:langRegEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    const lang = langsMap[matchs[1].replace(".","").toLowerCase()];
	    const langQ = q + lang + q;
	    const word = matchs[(doGreek?greekRegExCount:langRegExCount) + 2];
	    const sep = matchs[(doGreek?greekRegExCount:langRegExCount) + 3];
	    const first = matchs.index + 1 + matchs[1].length;
	    const second = first + word.length + sep.length; // 9 lang + 2
	    content += root.substring(0, first) + "</pre>";
	    const link = rootLinks.langClick(langQ); // "<a href='javascript:void(0)' onclick='linkLanguage("+langQ+",this)'>";
	    // console.log(link);
	    content += link + word + "</a>" + sep + "<pre>";
	    // recurse a few times
	    const next = root.substring(second);
	    if (level < maxWords) {
		content += parseContentsAndLemmas(doGreek, next, level+1);
	    } else {
		content += next;
	    }
	    // console.log("" + level + ": " + matchs[1] + " -> " + link);
	    return doGreek ? content : parseLemmas(content, 0);
	}
    }

    function parseLemmas(root, level) {
	var content = "";
	var matchs = root.match(lemmaRegEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    // const lang = q + langsMap[matchs[1].replace(".","").toLowerCase()] + q
	    const lemma = matchs[2];
	    const first = matchs.index + matchs[1].length;
	    const second = first + 1 + lemma.length; // 9 lang + 2
	    const link = "<a " + rootLinks.rootClick + ">";
	    content += root.substring(0, first) + "</pre>";
	    content += link + lemma + "</a>" + "<pre>";
	    // recurse a few times
	    const next = root.substring(second);
	    if (level < maxLemmas) {
		content += parseLemmas(next, level+1);
	    } else {
		content += next;
	    }
	    // console.log("" + level + ": " + matchs[1] + " -> " + link);
	    return content;
	}
    }

    /**
     *
     */
    function parseLinks(root, level, regEx, maxDef, text) {
        return parseDefinitionsAndLinks(root, level, regEx, maxDef, text, null);
    }

    function parseGermanMeaning(root, level, regEx) {
	var langQ = '"germ"';
	const link = rootLinks.langClick(langQ); 
        return parseDefinitionsAndLinks(root, level, regEx, 1, 2, link);
    }

    function parseDefinitions(root, level, regEx, maxDef, text) {
        return parseDefinitionsAndLinks(root, level, regEx, maxDef, text, rootLinks.definitionClick);
    }

    function parseDefinitionsAndLinks(root, level, regEx, maxDef, text, click) {
	var content = "";
	var matchs = root.match(regEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    let skip = matchs.index + 1;
	    for (var i=1; i<text; ++i)
		skip += matchs[i].length;
	    content += root.substring(0, skip);
	    const word = matchs[text];
	    const def = word.substring(1).replace("\n", "\n ");
	    if (click==null) {
		content += "<a href='"+def+"' target=" + level + ">" + def + "</a>";
	    } else {
		content += "<a " + click + ">" + def + "</a>";
	    }
	    // recurse a few times
	    const next = root.substring(matchs.index + skip + word.length);
	    if (++level < maxDef) {
		content += parseDefinitionsAndLinks(next, level, regEx, maxDef, text, click);
	    } else {
		content += next;
	    }
	    return content;
	}
    }
    
/** END */
