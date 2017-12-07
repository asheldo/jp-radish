import saveHistory from './controls-memo.js';

// links.js - re-export for href links

/**
 * referenced in the click/link handlers in parser
 */
export function linkLanguage(lang, link) {
    linkLanguageBase(lang, link);
    saveHistory();
    // return saveHistory(lastSelect.options[lastSelect.selectedIndex].text, lastSelect.value, roothistory);
}

function linkLanguageBase(lang, link) {
    var iekeyword = document.getElementById("iekeyword");
    iekeyword.scrollIntoView(false);
    iekeyword.value = link.innerHTML.replace("`","").replace("'");
    var ielang = document.getElementById("ielanguage");
    // console.log(ielang.value + "->" + lang);
    ielang.value = lang;
}

/**
 * no history save
 */
export function linkKeywordLanguage(link) {
    var ielangKey = document.getElementById("ielanguageKeyword");
    linkLanguageBase(ielangKey.value, link);
    // saveHistory();
}

export function linkKeywordDefinition(link) {
    var note = document.getElementById("note");
    note.scrollIntoView(false);
    let value = link.innerHTML;
    if (value.substring(0, 1) === "`") 
	value = value.substring(1, value.length-1);
    note.value = value;
}
