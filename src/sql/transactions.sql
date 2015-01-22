SELECT
tx_hash AS "txId",
block_hash AS "blockId",
block_height::bigint AS "blockHeight",
tx_locktime::bigint AS "locktime",
tx_version::bigint AS "version"
FROM tx_view
WHERE tx_hash IN ({{txIds | join(',')}})
