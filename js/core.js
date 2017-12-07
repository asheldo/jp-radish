import languages from './languages.js';
import databases from './database.js';
import handleRows from './controls-roots.js';
// core.js

// export * from './links.js';

// ?

/**
 * Main entrypoint, call on load
 */
export function initPage() {
    consoleShow();
    // langs(); -> during sync
    databases.connectOfflineToRemote()
	.then((results) => {
	    connect();
	})
	.catch((err) => {
	    console.log(err);
	    connect();
	});
}

/**
 * after sync, failure or success
 */
function connect() {
    remoteDatabase.info()
	.then((info) => console.log(info));
    return remoteDatabase.allDocs({
	include_docs: true,
	attachments: true
    })
	.then((results) => {
	    console.log("build languages");
	    buildLanguages();
	    handleRows(results);
	}) // handleRows
	.catch((err) => {
	    console.log(err);
	});

/**
 * basic offline form stuff - allow user access to ie language select(s)
 */
function buildLanguages() {
    mapLanguages();
    const sel = document.getElementById("ielanguage");
    const selKeys = document.getElementById("ielanguageKeyword");
    selKeys.enabled = true; // setAttribute('enabled', 'true');
    sel.options.length = selKeys.options.length = 0;
    selKeys.options[0] = new Option("","");
    const sorted = languages.sort();
    sorted.forEach(function(lang) {
        sel.options[sel.options.length]
	    = new Option(lang[1], lang[0]);
        selKeys.options[sel.options.length]
	    = new Option(lang[1], lang[0]);
    });
}

function mapLanguages() {
    languages.forEach(function(lang) {
	langsMap[lang[1]] = lang[0];
    });
}

function consoleShow() {				   
    console.error = console.log = (function (old_function, div_log) {
	return function(text) {
	    old_function(text);
	    div_log.innerHTML += text;
	    // alert(text);
	}
    } (console.log.bind(console), document.getElementById("div_log")));
}	       
    
	/*
	connection = remoteDatabase.changes({
	    since: 'now',
	    live: true
	})
	    .on('change', connect)
	    .on('complete', function(info) { console.log('cancel:'+info); })
	    .on('error', function(err) { console.log('changes error:'+err); });
	if (!liveChangesSubscription) {
	    connection.cancel();
	}
	*/
    }


/** END **/
