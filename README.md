# jp-radish
SPA for finding and annotating PIE roots in julius pokorny's:

    indogermanisches etymologisches worterbuch (1959, public domain)

Parsed and cleaned book content from academiaprisca.

# Install couchdb
http://couchdb.org

# Create couchdb database
curl -X PUT http://127.0.0.1:5984/pokorny-17112501

# Bulk upload
curl -d @db.json -H "Content-type: application/json" -X POST http://127.0.0.1:5984/pokorny-17112501/_bulk_docs > my.log
 
# Install 'jq' for json manipulations
E.g. if you dump and need to bulk upload

cat dump-db.json | jq '{"docs": [.rows[].doc]}' | jq 'del(.docs[]._rev)' > db.json-bulk-1

https://stackoverflow.com/a/37294271

# Update uri
replace "192.168.0.6" with "localhost" or your choice

# Run local to serve jp-radish:
http-server -p 3000 --cors

http://192.168.0.6:3000/

# Slow first browser load

PouchDB is used to replicate roots database to browser local storage,
allowing app to work offline, title reflecting progress during sync.

Learn more about 'offline first!' and PouchDB:

    https://pouchdb.com/getting-started.html