var unsavedSession = false;
var lastSelect;

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
export function saveHistory() {
    const opt = lastSelect.options[lastSelect.selectedIndex];
    // return saveHistory(opt.txt, lastSelect.value, roothistory);
    // save history
    // const selOpt = select.options[select.selectedIndex];
    if (opt.text !== "") {
	const hopts = roothistory.options;
	const len = hopts.length;
	if (len==0 || hopts[len-1].text!==opt.text) {
	    hopts[len] = new Option(opt.text, lastSelect.value);
	    // console.log(hopts[len].value);
	    unsavedSession = true;
	}
    }
}

/** END */
