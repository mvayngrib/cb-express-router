SELECT
tx_hash AS "txId",
tx_locktime::bigint AS "locktime",
tx_version::bigint AS "version"
FROM tx_view
INNER JOIN mempool_tx
USING (tx_hash)
