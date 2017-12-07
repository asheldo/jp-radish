import parseContent from './parser-root.js';
// controls-roots

var groupRoots = {};

/**
 * Build pie roots select(s)
 */

export function handleRows(results) {
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

/** END */
