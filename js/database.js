/*
 * Database
 */

const host = "192.168.0.6";
const nameDatabase = 'pokorny-17112501',
      nameKeywordsDb = 'pie-keys-17102401',
      nameMemoRootsDb = 'pie-memoroots-17102401';
const uriDatabases = `http://${host}:5984/`;
const liveChangesSubscription = false;

console.log(uriDatabases + nameDatabase);

/**
 * messes with emacs tabs, so at end of file
 */

export const remoteDatabase
    = new PouchDB(`${nameDatabase}`);
export const remoteKeywordsDb
    = new PouchDB(`${nameKeywordsDb}`);
export const remoteMemoRootsDb
    = new PouchDB(`${nameMemoRootsDb}`);

export function connectOfflineToRemote(callback) {
    return syncAndConnect(callback);
    // No live changes sync'ing for now, needs precise timing etc.
}

/** TODO Connect moved to caller */

function syncAndConnect() {
    const syncDom = document.getElementById('sync-wrapper');
    syncDom.setAttribute('data-sync-state', 'syncing-data');
    return to(remoteKeywordsDb,   nameKeywordsDb)
	.then(sync2)
	.catch(sync2);
}

    function to(db, dbName) {
	var opts = {live: true};
	return db.replicate.to(uriDatabases + dbName);
    }
    
    function from(db, dbName) {
	var opts = {live: true};
	return db.replicate.from(uriDatabases + dbName);
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
	.then( syncRoots2(callback) )
	.catch( syncRoots2(callback) );
}

/** end of chain, back to caller for results handling */
function syncRoots2(info) {
    console.log("6:" + info);
    setSessions(); // setup typeahead
    // langs()	
    const syncDom = document.getElementById('sync-wrapper');
    return from(remoteDatabase, nameDatabase)
	.then((info) => {
	    syncDom.innerHTML = 'sync done - building...';
	    // callback();
	})
	.catch((err) => {
	    syncDom.innerHTML = 'sync failed - building...';
	    // callback();
	});
}

// Show replication error state
function syncError() {
    var syncDom = document.getElementById('sync-wrapper');
    syncDom.setAttribute('data-sync-state', 'error');
}

/** END */
