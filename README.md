# cb-node-server

Common blockchain API server backed by a POSTGRES database.

This is **not** a blockchain parser, it relies on an up-to-date POSTGRES database.


For now, the SQL queries in `lib/sql/` are tailored to Helloblock.io database schemas.

The ideal would be to have these swappable to ANY database.
The implementation should be simple enough, and the work flow is still in WIP.


## tests

Currently there are no localized tests.
You can check its results and conformity against https://github.com/common-blockchain/cb-node however, as it is quite thorough.


## example

See https://common-blockchain.herokuapp.com/ for a live heroku server as an example.
