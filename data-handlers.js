const host = "192.168.0.6";
//  : "localhost";
const remoteDatabase = new PouchDB(`http://${host}:5984/pokory-17102401`);
const remoteKeywordsDb = new PouchDB(`http://${host}:5984/pie-keys-17102401`);
const remoteMemoRootsDb = new PouchDB(`http://${host}:5984/pie-memoroots-17102401`);
let groupRoots = initPage();
				     
function initPage() {
  remoteDatabase.info().then(function (info) {
    console.log(info);
  });
  remoteDatabase.allDocs({
    include_docs: true,
    attachments: true
  }).then(handleRows).catch(err => console.log(err));
  return {};
}
				     
function handleRows(results) {
    let groupsAndRoots = defineGroupsFromRoots(results.rows);
    let groups = groupsAndRoots.groups;
    //
    groupRoots = groupsAndRoots.groupRoots;       
    fillRootGroupsSelect(groups);
    fillAllRootsSelect(results.rows);
    fillAllFirstRootsSelect(results.rows);
}
      
function defineGroupsFromRoots(roots) {
    let groups = [];
    let groupRoots = {}
    roots.forEach( root => {
	let doc = root.doc;
	let id = doc._id;
	let re = /\/([*]{0,1}..)/u;
	if (id == null) {
	    console.log("no match");
	} else {
	    let matchs = id.match(re);
	    if (matchs == null) {
		// groups[groups.length] = {};
	    } else if (matchs.length > 1) {
		if (matchs[1] !== groups[groups.length - 1]) {
		    groups[groups.length] = matchs[1];
		    groupRoots[matchs[1]] = [ id ];
		} else {
		    let r = groupRoots[matchs[1]];
		    r[r.length] = id;      
		}
	    }
	    // else {        console.log("empty"); // groups[""] = {};       }
	}
    });
    let groupsAndRoots = {};
    groupsAndRoots.groups = groups.sort();
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
				   
function fillAllRootsSelect(roots) {
    let select = document.getElementById("allroots");
    select.options[0] = new Option("", "");     
    roots.forEach(function(root) {
        let id = root.doc._id;
	let name = id.length <= 24 ? id : id.substring(0, 24);
        select.options[select.options.length] = new Option(name, id);
    });
}
				   
function fillAllFirstRootsSelect(roots) {
    let select = document.getElementById("allfirstroots");
    select.options[0] = new Option("", "");
    let re = /\/([^/]{2,20})[,\/]{1}/u;
    const all = {}
    const keys = []
    roots.forEach(function(root) {
        let id = root.doc._id;
	let match = id.match(re);
	if (match != null && match.length > 1) {
            // select.options[select.options.length] = new Option(match[1], id);
	    keys[keys.length] = match[1];
	    all[match[1]] = id;
	}
    });
    keys.sort().forEach(function(key) {
        select.options[select.options.length] = new Option(key, all[key]);
    });
}
				   
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

/**
 * entry point
 */
function showUpdate(select, pieroot, roothistory) {
    const oldValue = pieroot.value;
    pieroot.value = showRootContent(select, oldValue);
//    return saveHistory(select, oldValue, roothistory);
}

function parseContent(root) {
    const content = "<pre>" + parseContents(root, 0) + "</pre>";
    // console.log(root + "\n" + content);
    return content;
}
				   
				   const languages = [["sk","old indian"],["gk","gr"],["schwed","schwed"],["lat","lat"],["got","got"],["germ","germ"],["ags","ags"],["aisl","aisl"],["av","av"],["ahd","ahd"],["mengl","mengl"],["engl","engl"],["cymr","cymr"],["air","air"]];				   
const langsMap = {};
languages.forEach(function(lang) {
    langsMap[lang[1]] = lang[0];
});
console.log(langsMap);				   
function langs() {
    const sel = document.getElementById("ielanguage");
    languages.forEach(function(lang) {
        sel.options[sel.options.length]
	    = new Option(lang[1], lang[0]);
    });
}

function parseContents(root, level) {
    var content = "";
    var q = '"';
    const langs = 14;
    let re = /((Old Indian)|([Gg]r\.)|(schwed\.)|(ahd\.)|([Ee]ngl\.)|(mengl\.)|(ags\.)|([Gg]erm\.)|(air\.)|([Cc]ymr\.)|(mcymr\.)|([Gg]ot\.)|(av\.)|([Ll]at\.))\s((?!and)[^\s]*)\s/;
    var matchs = root.match(re);
    // console.log(matchs);
    if (matchs == null) {
	return root;
    } else {
	console.log(matchs[0]);
	const lang = q + langsMap[matchs[1].replace(".","").toLowerCase()] + q
	
	const word = matchs[langs + 2];
	const first = matchs.index + 1 + matchs[1].length;
	const second = first + 1 + word.length; // 9 lang + 2
	// content = "<pre>";
	content += root.substring(0, first) + "</pre>";
	const link = "<a href='javascript:void(0)' onclick='linkLanguage("+lang+",this)'>";
	console.log(link);
	content += link + word + "</a>" + "<pre>";
	// recurse a few times
	const next = root.substring(second);
	if (level < 16) {
	    content += parseContents(next, level+1);
	} else {
	    content += next;
	}
	// content += "</pre>";
	// console.log("" + level + ": " + matchs[1] + " -> " + link);
	return content;
    }
}

var lastSelect;				   

function linkLanguage(lang, link) {
    var iekeyword = document.getElementById("iekeyword");
    iekeyword.scrollIntoView(false);
    iekeyword.value = link.innerHTML;
    var ielang = document.getElementById("ielanguage");
    console.log(ielang.value + "->" + lang);
    ielang.value = lang;
    return saveHistory(lastSelect.text, lastSelect.value, roothistory);
}

/**
 * From any list, pick a Root to show in detail
 */
function showRootContent(select, oldRoot) {
    lastSelect = select;
    let opt = select.options[select.selectedIndex];
    let rootId = opt.value;
    if (rootId !== "") {
	// console.log(opt.text + " -> " + opt.value + " = " + rootId);
	let out = document.getElementById("root");
	let outParsed = document.getElementById("root-table-scroll");
	let doc = remoteDatabase.get(rootId).then( function(result) {
	    const content = parseContent(result.content);
            out.innerHTML = result.content;
	    outParsed.innerHTML = content;
	});
	return rootId;
    }
    return oldRoot;
}

// myService.exist = function(){
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
				   
function saveMemoRoots() {
    const session = document.getElementById("session");
    const roothistory = document.getElementById("roothistory");
    const roots = roothistory.options;
    const memo = {"_id": session, "type": "lang:word:roots", "roots": roots};
    remoteMemoRootsDb.put(memo).then(function (res) {
        console.log(res);
    }).catch(function (err) {
	console.log(err);
	// if (err.error === "conflict")
	remoteKeywordsDb.get(session).then(function (doc) {
	    memo._rev = doc._rev;
	    return remoteMemoRootsDb.put(memo);
	}).catch(function (err) {
	    console.log(err);
	});
    });

}

function saveHistory(text, value, roothistory) {
    // save history
    // const selOpt = select.options[select.selectedIndex];
    if (text !== "") {
	const hopts = roothistory.options;
	const len = hopts.length;
	if (len==0 || hopts[len-1].text!==text) {
	    hopts[len] = new Option(text, value);
	    // console.log(hopts[len].value);
	}
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
    /*
    	<select id="ielanguage"/>
	  <input id="iekeyword" width="15"/>
	  <input id="pieroot" width="25"/>
	  <button onclick="saveKeyword()"/>
 */
