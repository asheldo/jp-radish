xf    /**
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


