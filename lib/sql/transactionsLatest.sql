SELECT
tx_hash AS "txId",
tx_locktime AS "locktime",
tx_version AS "version"
FROM tx_view
INNER JOIN mempool_tx
USING (tx_hash)
