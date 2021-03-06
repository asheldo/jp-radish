
const host = "192.168.0.6";
//  : "localhost";
const liveChangesSubscription = false;
var groupRoots = {};
var unsavedSession = false;
var nameDatabase = 'pokorny-17112501',
    nameKeywordsDb = 'pie-keys-17102401',
    nameMemoRootsDb = 'pie-memoroots-17102401';
var uriDatabases = `http://${host}:5984/`;
var remoteDatabase, remoteKeywordsDb, remoteMemoRootsDb;

const maxWords = 128, maxLemmas = 8, maxDefinitions = 128;

const defRegEx = /((\s`[^<\.`]*')|(phonetic mutation))/;
const germanRegEx = /(German meaning:\*)( `.*')/;
const meaningRegEx = /(English meaning:\*)( [^\n]*)/;
const hrefRegEx = /(\bhttp[s]?:\/\/[^\s]*\b)[\s\.\,\)]/;

const lemmaRegEx = /(\*Root \/ lemma:[^\/]*)(\/[^`']*)(\s:\*\s`)/;
const idGroupRegEx = /\/([*]{0,1}[(]{0,1}[^(]{0,1}[)]{0,1}[^)]{0,1})/u;
// short versions
const firstRootRegEx = /\/([^/]{2,20})[,\/]{1}/;

const greekRegEx = /((\b[Gg]r\.)|([Mm]aked\.)|([Pp]hryg\.))\s([^,\s]*)([,\s]*)/;
const greekRegExCount = greekRegEx.source.split("|").length;
const langRegEx = /((\b[Hh]itt\.)|(\b[Ll]it\.)|(\b[Aa]lb\.)|(\b[Rr]um\.)|([Ll]ett\.)|([Rr]uss\.)|([Ss]lav\.)|(čech\.)|([Ss]lov\.)|(\b[Hh]es\.)|(Old Church Slavic)|(Old Indian)|(\baisl\.)|(schwed\.)|(nhd\.)|(mhd\.)|(ahd\.)|([Gg]ot\.)|(\bas\.)|(\b[Ee]ngl\.)|(mengl\.)|(\bags\.)|([Gg]erm\.)|(air\.)|(mir\.)|(\b[Aa]rm\.)|([Ii]llyr\.)|([Cc]ymr\.)|([Mm]cymr\.)|(\bav\.)|([Aa]vest\.)|(ven\.-ill\.)|(\b[Ll]at\.)|(\b[Tt]och\. B)|(\b[Tt]och\. A))\s(\/[^\/]*\/)([,\s]*)/;
const langRegExCount = langRegEx.source.split("|").length;

const languages = [["hitt","hitt"],
		   ["old indian","old indian"],
		   ["gr","gr"],["maked","maked"],["phryg","phryg"],
		   ["av","av"],["av","avest"],
		   ["lat","lat"],
		   ["russ","russ"],["old church slavic","old church slavic"],["slav","slav"],["čech","čech"],["slov","slov"],
		   ["lit","lit"],
		   ["alb","alb"],
		   ["got","got"],["germ","germ"],["as","as"],["ags","ags"],["aisl","aisl"],
		   ["schwed","schwed"],
		   ["ahd","ahd"],["nhd","nhd"],
		   ["mengl","mengl"],["engl","engl"],
		   ["cymr","cymr"],["air","air"],["mir","mir"],
		   ["illyr","illyr"],["ven.-ill","ven.-ill"],
		   ["arm","arm"],
		   ["hes","hes"],
		   ["toch","toch"]];
const langsMap = {};    
				   // console.log(langsMa
const keyClick = "onclick='linkKeywordLanguage(this)' href='javascript:void(0)' ";
const rootClick = "onclick='showUpdate(this.innerHTML, pieroot, roothistory)' href='javascript:void(0)'"; 				       
const definitionClick = "onclick='linkKeywordDefinition(this)' href='javascript:void(0)' ";
// TODO
const externalLinks = [["Abkurzungsverzeichnis", "http://wwwg.uni-klu.ac.at/eeo/AbkuerzungsverzeichnisSprachen.pdf"]];

var lastSelect;				   

/*
 * db setup first
 */
console.log(uriDatabases + nameDatabase);
initData();

/**
 * call on load
 */
function initPage() {
    consoleShow();
    // langs(); -> during sync
    connectOfflineToRemote();
    // temp home:
    // sessionsSuggest();
}

    /**
     * basic forms stuff
     */
    function langs() {
	const langKey = document.getElementById('ielanguageKeyword');
	langKey.enabled = true; // setAttribute('enabled', 'true');
	const sel = document.getElementById("ielanguage");
	const selKeys = document.getElementById("ielanguageKeyword");
	sel.options.length = selKeys.options.length = 0;
	selKeys.options[0] = new Option("","");
	languages.sort().forEach(function(lang) {
            sel.options[sel.options.length]
		= new Option(lang[1], lang[0]);
            selKeys.options[sel.options.length]
		= new Option(lang[1], lang[0]);
	});
	languages.forEach(function(lang) {
	    langsMap[lang[1]] = lang[0];
	});
    }

    /**
     *
     */				   
    function consoleShow() {				   
	console.error = console.log = (function (old_function, div_log) {
	    return function(text) {
		old_function(text);
		div_log.innerHTML += text;
		// alert(text);
	    }
	} (console.log.bind(console), document.getElementById("div_log")));
    }	       
    
    // var connection;
    function connectOfflineToRemote() {
	syncAndConnect();
	// No live changes sync'ing for now, needs precise timing etc.
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

    /**
     * after sync, failure or success
     */
    function connect() {
	remoteDatabase.info()
	    .then(function (info) {
		console.log(info);
	    });
	remoteDatabase.allDocs({
	    include_docs: true,
	    attachments: true
	})
	    .then(handleRows)
	    .catch(err => console.log(err));
    }

    function to(db, dbName) {
	var opts = {live: true};
	return db.replicate.to(uriDatabases + dbName);
    }
    
    function from(db, dbName) {
	var opts = {live: true};
	return db.replicate.from(uriDatabases + dbName);
    }

    function syncAndConnect() {
	const syncDom = document.getElementById('sync-wrapper');
	syncDom.setAttribute('data-sync-state', 'syncing-data');
	return to(remoteKeywordsDb,   nameKeywordsDb)
	    .then(sync2)
	    .catch(sync2);
    }

    function sync2(info) {
	console.log("2:" + info);
	return from(remoteKeywordsDb, nameKeywordsDb)
	    .then(sync3)
	    // Fast-forward, to setSessions()/connect(), if remote inaccessible
	    .catch(syncRoots2);
    }

    function sync3(info) {
	console.log("3:" + info);
	langs();
	return to(remoteMemoRootsDb,  nameMemoRootsDb)
	    .then(sync4)
	    .catch(sync4);
    }

    function sync4(info) {
	console.log("4:" + info);
	return from(remoteMemoRootsDb,  nameMemoRootsDb)
	    .then(syncRoots)
	    .catch(syncRoots);
    }
	
    function syncRoots(info) {
	console.log("5:" + info);
	const syncDom = document.getElementById('sync-wrapper');
	syncDom.innerHTML = 'syncing roots data..';	
	return to(remoteDatabase, nameDatabase)
	    .then( syncRoots2)
	    .catch( syncRoots2);
    }

    function syncRoots2(info) {
	console.log("6:" + info);
	setSessions(); // setup typeahead
	langs();
	const syncDom = document.getElementById('sync-wrapper');
	return from(remoteDatabase, nameDatabase)
	    .then((info) => {
		syncDom.innerHTML = 'sync done - building...';
		connect();
	    })
	    .catch((err) => {
		syncDom.innerHTML = 'sync failed - building...';
		connect();
	    });
    }

    // Show replication error state
    function syncError() {
	var syncDom = document.getElementById('sync-wrapper');
	syncDom.setAttribute('data-sync-state', 'error');
    }

    /**
     *
     */
    var sessions = [];

    function sessionsSuggest() {
	var sessionEl = document.getElementById("sessionSelection");
	// const sessions = ["2017-11-27T00:35:56.228Z-session"];
	$.typeahead({
	    input: '.js-typeahead-session_v1',
	    order: "desc",
	    source: {
		data: sessions
	    },
	    callback: {
		onInit: function (node) {
		    console.log('Typeahead Initiated on ' + node.selector);
		},
		onClickAfter: function (node, a, item, event) {
		    event.preventDefault();
		    sessionEl.value = item.display;
		    loadMemoRoots(sessionEl);
		}
	    }
	});
    }

    function setSessions() {
	remoteMemoRootsDb.allDocs({
	    include_docs: false,
	    attachments: false
	})
	    .then((results) => {
		sessions = [];
		results.rows.forEach((row) => {
		    sessions[sessions.length] = row.id;
		});
		console.log(sessions);
		// temp home:
		sessionsSuggest();
	    });
    }
	/*	 pouch.search({
	     query: 'mario',
	     fields: ['title', 'text'],
	     include_docs: true,
	     highlighting: true
	 })
	    .then(function (res) {
		console.log(res.rows[0].doc.text); // "It's-a me, Mario!" 
		console.log(res.rows[0].highlighting); // {"text": "It's-a me, <strong>Mario</strong>!"} 
	    });
*/


    /**
     * Build pie roots select(s)
     */
				   
    function handleRows(results) {
	var syncDom = document.getElementById('sync-wrapper');
	const mapAsc = mapRoots(results.rows);
	fillAllRootsSelect(mapAsc);
	fillAllFirstRootsSelect(mapAsc);
	//
	let groupsAndRoots = defineGroupsFromRoots(mapAsc);
	let groups = groupsAndRoots.groups;
	groupRoots = groupsAndRoots.groupRoots;       
	fillRootGroupsSelect(groups);

	syncDom.innerHTML = 'pokorny-radish ready!';
    }
    
    function mapRoots(roots) {
	let map = new Map();
	let ids = {};
	roots.forEach(function(root) {
	    let id = root.doc._id.trim();
	    if (ids[id] == null) {
		let pageStart = 10000 + parseInt(root.doc.pageStart);
		while (map.get(pageStart)) {
		    pageStart += 0.01;
		}
		map.set(pageStart, id);
		ids[id] = 1;
		if (pageStart < 10030.0) {
		    // console.log(id + "\n" + root.doc);
		}
	    }
	});
	let mapAsc = new Map([...map.entries()].sort());
	return mapAsc;
    }
    
    function defineGroupsFromRoots(mapAsc) {
	let groups = [];
	let groupRoots = {}
	Array.from(mapAsc.values()).forEach( id => {
	    let matchs = id.match(idGroupRegEx);
	    if (matchs == null) {
		// groups[groups.length] = {};
	    } else if (matchs.length > 1) {
		const first = matchs[1];
		if (groupRoots[first] == null) {
		    groups[groups.length] = first;
		    groupRoots[first] = [ id ];
		} else {
		    let r = groupRoots[first];
		    r[r.length] = id;      
		}
	    }
	});
	const groupsAndRoots = {};
	console.log(groups);
	groupsAndRoots.groups = groups;
	groupsAndRoots.groupRoots = groupRoots;
	return groupsAndRoots;
    }

    function fillRootGroupsSelect(groups) {
	let select = document.getElementById("groups");
	select.options[0] = new Option("", "");     
	groups.forEach(function(group) {
	    // let doc = root.doc;
            select.options[select.options.length] = new Option(group, group);
	});
    }
    
    function fillAllRootsSelect(map) {
	let select = document.getElementById("allroots");
	select.options[0] = new Option("", "");
	var last = "";
	for (var [pageStart, id] of map.entries()) {
	    let name = id.length <= 24 ? id : id.substring(0, 24);
	    if (id !== last) {
		select.options[select.options.length] = new Option(name, id);
		last = id;
	    } else {
		console.log("dupe:" + last);
	    }
	};
    }
    
    /**
     *
     */				   
    function fillAllFirstRootsSelect(map) {
	let select = document.getElementById("allfirstroots");
	select.options[0] = new Option("", "");
	var last = "";				     
	for (var [pageStart, id] of map.entries()) {
       	    let match = id.match(firstRootRegEx);
	    if (match != null && match.length > 1 && id !== last) {
		select.options[select.options.length] = new Option(match[1], id);
		last = id;
       	    } else {
		console.log("dupe:" + last);
	    }
	};
    }

    /**
     * one alpha group of roots
     */    
    function listGroupRoots(select) {
	let group = select.options[select.selectedIndex].value;
	let roots = groupRoots[group]
	let rootsOut = document.getElementById("docs");
	rootsOut.options.length = 0;
	rootsOut.options[0] = new Option("", "");
	roots.forEach(function(root) {
            rootsOut.options[rootsOut.options.length] = new Option(root, root);
	});
    }

    /****************************
     * Parse word and lemma links
     */

    function parseContent(root) {
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
	    const link = "<a href='javascript:void(0)' onclick='linkLanguage("+langQ+",this)'>";
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
	    const link = "<a " + rootClick + ">";
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
	const link = " href='javascript:void(0)' onclick='linkLanguage("+langQ+",this)'";
        return parseDefinitionsAndLinks(root, level, regEx, 1, 2, link);
    }

    function parseDefinitions(root, level, regEx, maxDef, text) {
        return parseDefinitionsAndLinks(root, level, regEx, maxDef, text, definitionClick);
    }

    function parseDefinitionsAndLinks(root, level, regEx, maxDef, text, href) {
	var content = "";
	var matchs = root.match(regEx);
	// console.log(matchs);
	if (matchs == null) {
	    return root;
	} else {
	    let skip = 0;
	    for (var i=1; i<text; ++i)
		skip += matchs[i].length;
	    content += root.substring(0, matchs.index + skip + 1);
	    const def = matchs[text].substring(1).replace("\n", "\n ");
	    const link = "<a " + (href==null
				  ? "href='"+def+"' target=" + level
				  : href) + ">";
	    content += link + def + "</a>";
	    if (href==null) {
		// console.log("url");
	    } else {
		// console.log(link);
	    }
	    // recurse a few times
	    const next = root.substring(matchs.index + skip + matchs[text].length);
	    if (++level < maxDef) {
		content += parseDefinitionsAndLinks(next, level, regEx, maxDef, text, href);
	    } else {
		content += next;
	    }
	    return content;
	}
    }
    
    /**
     * and the link handlers parsed above
     */
    function linkLanguage(lang, link) {
	linkLanguageBase(lang, link);
	return saveHistory(lastSelect.options[lastSelect.selectedIndex].text,
			   lastSelect.value, roothistory);
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
    function linkKeywordLanguage(link) {
	var ielangKey = document.getElementById("ielanguageKeyword");
	return linkLanguageBase(ielangKey.value, link);
    }

    function linkKeywordDefinition(link) {
	var note = document.getElementById("note");
	note.scrollIntoView(false);
	let value = link.innerHTML;
	if (value.substring(0, 1) === "`") 
	    value = value.substring(1, value.length-1);
	note.value = value;
    }

    /**
     * handlers for root/lemma change
     */

    function showUpdate(select, pieroot, roothistory) {
	const oldValue = pieroot.value;
	pieroot.value = showRootContent(select, oldValue);
	//    return saveHistory(select, oldValue, roothistory);
    }

    /**
     * From any list, pick a Root to show in detail
     */
    function showRootContent(select, oldRoot) {
	let rootId = select;
	if (select.options) {
	    lastSelect = select;
	    opt = select.options[select.selectedIndex];
	    rootId = opt.value;
	}
	if (rootId !== "") {
	    // console.log(opt.text + " -> " + opt.value + " = " + rootId);
	    let outParsed = document.getElementById("root-table-scroll");
	    remoteDatabase.get(rootId).then( function(result) {
		let content = parseContent(result.content);
		outParsed.innerHTML = content;
	    }).catch(function(err) {
		console.log(rootId);
		console.log(err);
		remoteDatabase.get(rootId + "*").then( function(result) {
		    let content = parseContent(result.content);
		    outParsed.innerHTML = content;
		}).catch(function(err) {		    
		    console.log("Get failed");
		});
	    });
	    return rootId;
	}
	return oldRoot;
    }

    // myService.exist = function(){
    /**
     * Add keyword to keys db
     */				   
    function showKeywords(select) {
	let scrollView = document.getElementById("keyword-table-scroll");
	let opt = select.options[select.selectedIndex];
	let langId = opt.value;
	if (langId != null) {
	    var opts = {};
	    if (langId !== "")
		opts.key = langId;
	    remoteKeywordsDb.query('ielang/ielang-words-root-and-related-meanings', opts)
		.then( result => {
		    var values = "";
		    var vs = [];
		    result.rows.forEach( row => {
			var word = "<a " + keyClick + ">" + row.value[0] + "</a>";
			var value = "<p id='keyword'>" + word + "<br/>";
			var info = row.value[1];
			var key = "";
			Object.keys(info).forEach(k => {
			    key = k;
			    value += "<a "+rootClick+">"+k+"</a><br/>"+Object.keys(info[key]);
			});
			value += "</p><br/>";
			vs[vs.length] = [key, value];
		    });
		    vs.sort().forEach( v => values += v[1] );
		    scrollView.innerHTML = values;
		});
	}
    }
    
    function saveKeyword() {
	let langEl = document.getElementById("ielanguage");
	let lang = langEl.options[langEl.selectedIndex].text;
	console.log(lang);
	let root = document.getElementById("pieroot").value;
	let key = document.getElementById("iekeyword").value;
	let note = document.getElementById("note").value;
	if (root == null || root === "" || key == null || key === "") {
	    return;
	}
	keywordPut(lang, key, root, note);
    }

    function keywordExist(key) {
	return remoteKeywordsDb.get(key).then(function () {
            return Promise.resolve(true);
	}).catch(function () {
            return Promise.resolve(false);
	});
    };

    function keywordPut(lang, key, root, note) {
	const langkey = lang + " : " + key;    
	const info = {}
	info[note] = new Date();
	const roots = {};
	roots[root] = info;
	const doc = {"_id": langkey, "type": "lang:word:roots", "roots": roots};
	remoteKeywordsDb.put(doc).then(function (res) {
            console.log(res);
	}).catch(function (err) {
	    console.log(err);
	    // if (err.error === "conflict")
	    remoteKeywordsDb.get(langkey).then(function (doc) {
		if (doc.roots[root] == null) {
		    doc.roots[root] = info;
		} else {
		    doc.roots[root][note] = info[note];
		}
		return remoteKeywordsDb.put(
		    {"_id": langkey, "_rev": doc._rev, "type": "lang:word:roots", "roots": doc.roots }
		);
	    }).catch(function (err) {
		console.log(err);
	    });
	});
    };

    /**
     * Retrieve if saved this session before
     */
    function loadMemoRoots(el) {
	// const session = document.getElementById("session").value;
	const session = el.value;
	if (session === "") {
	    return;
	}
	const history = document.getElementById("roothistory").options;
	remoteMemoRootsDb.get(session).then( session => {
	    if (session == null || session.type !== "lang:word:roots") {
		alert("Not updating with nothing");
	    } else if (unsavedSession
		       && history.length > session.roots.length) {
		console.log(session.roots);
		alert("Not updating, count difference");
	    } else {
		console.log(session.roots);
		history.length = 0;
		for (var i = 0; i < session.roots.length; ++i) {
		    var root = session.roots[i];
		    console.log(root);
		    history[history.length] = new Option(root[0], root[1]);
		};	    
	    }
	}).catch(function (err) {
	    console.log(err);
	}); 
    }
    
    function saveMemoRoots() {
	unsavedSession = false;
	// const session = document.getElementById("session").value;
	var sessionEl = document.getElementById('sessionSelection');
	const session = sessionEl.value;
	if (session === "") {
	    history.length = 0;
	}
	const history = document.getElementById("roothistory").options;
	const roots = [];
	for (var i = 0; i < history.length; ++i) {
	    var opt = history[i];
	    roots[roots.length] = [opt.text, opt.value];
	};
	const memo = {"_id": session, "type": "lang:word:roots", "roots": roots};
	// console.log("249: " + memo);
	remoteMemoRootsDb.put(memo).then(function (res) {
            console.log(res);
	}).catch(function (err) {
	    console.log(err);
	    // if (err.error === "conflict")
	    remoteMemoRootsDb.get(session).then(function (doc) {
		if (history.length < doc.roots.length) {
		    // console.log(doc.roots);
		    alert("Not persisting, count difference");
		} else {
		    memo._rev = doc._rev;
		    // console.log(memo);
		    // return
		    remoteMemoRootsDb.put(memo);
		}
	    }).catch(function (err) {
		console.log("262: " + err);
	    });
	});
    }

    /**
     * Add one to list
     */				   
    function saveHistory(text, value, roothistory) {
	// save history
	// const selOpt = select.options[select.selectedIndex];
	if (text !== "") {
	    const hopts = roothistory.options;
	    const len = hopts.length;
	    if (len==0 || hopts[len-1].text!==text) {
		hopts[len] = new Option(text, value);
		// console.log(hopts[len].value);
		unsavedSession = true;
	    }
	}
    }

/**
 * messes with emacs tabs, so at end of file
 */
function initData() {
    remoteDatabase = new PouchDB(`${nameDatabase}`);
    remoteKeywordsDb = new PouchDB(`${nameKeywordsDb}`);
    remoteMemoRootsDb = new PouchDB(`${nameMemoRootsDb}`);    
}


/** END **/
