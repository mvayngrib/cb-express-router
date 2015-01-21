# cb-node-server

Common blockchain API server backed by a POSTGRES database.

This is **not** a blockchain parser, it relies on an up-to-date POSTGRES database.


For now, the SQL queries in `src/sql/` are tailored to Helloblock.io database schemas.
It would be ideal to add SQL bindings to an insight server.


## tests

Currently there are no localized tests.  You however check its results and conformity against https://github.com/dcousens/cb-node, which is quite thorough.
