/**
 * controls-keywords
 */
import * as links from 'parser-root-links';

    /**
     * Add keyword to keys db
     */				   
    function showKeywords(select) {
	let scrollView = document.getElementById("keyword-table-scroll");
	let opt = select.options[select.selectedIndex];
	let langId = opt.value;
	if (langId != null) {
	    var opts = {};
	    if (langId !== "") {
		opts.key = langId;
	    }
	    remoteKeywordsDb.query('ielang/'
				   + 'ielang-words-root-and-related-meanings',
				   opts)
		.then(keywordHandler(scrollView));
	}
    }

	const keywordHandler = (view) => {
	    (result) => {
		var values = "";
		var vs = [];
		result.rows.forEach( row => {
		    var word = "<a " + keyClick + ">" + row.value[0] + "</a>";
		    var value = "<p id='keyword'>" + word + "<br/>";
		    var info = row.value[1];
		    var key = "";
		    Object.keys(info).forEach(k => {
			key = k;
			value += "<a "+ links.rootClick + ">" + k + "</a><br/>"
			    + Object.keys(info[key]);
		    });
		    value += "</p><br/>";
		    vs[vs.length] = [key, value];
		});
		vs.sort().forEach((v) => { values += v[1]; });
		view.innerHTML = values;
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

