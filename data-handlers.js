/*
 * Fetch into memory the entire index of the couchdb pokorny roots.
 * Then break down into two-letter groups of roots.
 * TODO: Put the non-groupable somewhere? 
 */

let groupRoots = {};

const remoteDatabase = new PouchDB(`http://localhost:5984/pokory-17102401`);
				   
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
    // fillRootsSelect(results.rows);
}
      
function defineGroupsFromRoots(roots) {
    let groups = [];
    let groupRoots = {}
    roots.forEach( root => {
	let doc = root.doc;
	let id = doc._id;
	let re = /\/(\({0,1}\w\){0,1}\w)/;
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
				   
function fillRootsSelect(roots) {
    let select = document.getElementById("docs");
    select.options[0] = new Option("", "");     
    roots.forEach(function(root) {
        let doc = root.doc;
        select.options[select.options.length] = new Option(doc._id, doc._id);
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
}

