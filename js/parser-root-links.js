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
	+ ",this)'>"
}


/**  const externalLinks = [["Abkurzungsverzeichnis",
			       "http://wwwg.uni-klu.ac.at/eeo/"
			       + "AbkuerzungsverzeichnisSprachen.pdf"]];
*/

    /**
     * see the click/link handlers in parser
     */
