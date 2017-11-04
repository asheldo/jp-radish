/*
 * Fetch into memory the entire index of the couchdb pokorny roots.
 * Then break down into two-letter groups of roots.
 * TODO: Put the non-groupable somewhere? 
 */

let groupRoots = {};

const remoteDatabase = new PouchDB(`http://localhost:5984/pokory-17102401`);
const remoteKeywordsDb = new PouchDB(`http://localhost:5984/pie-keys-17102401`);
				   
remoteDatabase.info().then(function (info) {
    console.log(info);
});

remoteDatabase.allDocs({
    include_docs: true,
    attachments: true
}).then(handleRows).catch(err => console.log(err));

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
        select.options[select.options.length] = new Option(id, id);
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
				   
function showRootContent(select) {
    let rootId = select.options[select.selectedIndex].value;
    let out = document.getElementById("root");
    let doc = remoteDatabase.get(rootId).then( function(result) {
        out.innerHTML = result.content;
    });
    return rootId;
}

function langs() {
    const sel = document.getElementById("ielanguage");
    const langs = ["sk","gk","lat","got","ger","ags","aisl","av"];
    langs.forEach(function(lang) {
        sel.options[sel.options.length] = new Option(lang, lang);
    });
}

// myService.exist = function(){
function keywordExist(key) {
    return remoteKeywordsDb.get(key).then(function () {
        return Promise.resolve(true);
    }).catch(function () {
        return Promise.resolve(false);
    });
};

function keywordPut(lang, key, root) {
    const langkey = lang + " : " + key;
    const roots = {};
    roots[root] = new Date();
    remoteKeywordsDb.put({"_id": langkey, "type": "lang:word:roots" , "roots": roots} 
    ).then(function (res) {
        console.log(res);
    }).catch(function (err) {
	console.log(err);
	// if (err.error === "conflict")
	remoteKeywordsDb.get(langkey).then(function (doc) {
	    if (doc.roots[root] == null) {
		doc.roots[root] = new Date();
	    }
	    return remoteKeywordsDb.put(
		{"_id": langkey, "_rev": doc._rev, "type": "lang:word:roots", "roots": doc.roots }
	    );
	}).catch(function (err) {
	    console.log(err);
	});
    });
};

function saveKeyword() {
    let lang = document.getElementById("ielanguage").value;
    let root = document.getElementById("pieroot").value;
    let key = document.getElementById("iekeyword").value;
    if (root == null || root === "" || key == null || key === "") {
	return;
    }
    keywordPut(lang, key, root);
    /*
    	<select id="ielanguage"/>
	  <input id="iekeyword" width="15"/>
	  <input id="pieroot" width="25"/>
	  <button onclick="saveKeyword()"/>
 */
}


