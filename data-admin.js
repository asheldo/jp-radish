const host = "192.168.0.6";

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
  }).then(adminRows).catch(err => console.log(err));
  return {};
}	     
function adminRows(results) {
    // let groupsAndRoots = defineGroupsFromRoots(results.rows);
    let roots = results.rows;
    roots.forEach( root => {
	let doc = root.doc;
	if (doc.pageStart) {
	    console.log("pageStart");
	    return;
	}
	let content = doc.content;
	let type = doc.type;
	let re = /(Page\(s\):\*) (\d*)-*(\d*)/;
	let matchs = content.match(re);
	if (matchs == null) {
	    console.log("Stopping.");
	    return;
	} else {
	    if (doc.pageStart) {
		putPages(doc);
	    } else {
		putPages(doc, matchs);
	    }
	};
    });
}
function putPages(doc) {
    doc.pageStart = parseInt("" + doc.pageStart);
    doc.pageEnd = parseInt("" + doc.pageEnd);
    remoteDatabase.put(doc);
}
function putPages(doc, matchs) {
    doc.pageStart = matchs[2];
    doc.pageEnd = doc.pageStart;
    if (matchs.length > 3) {
	doc.pageEnd = matchs[3];
    }
    remoteDatabase.put(doc);
}
				      /*
function keywordPut(lang, key, root, note) {
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
*/
				      
