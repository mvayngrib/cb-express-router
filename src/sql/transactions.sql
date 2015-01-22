SELECT
tx_hash AS "txId",
block_hash AS "blockId",
block_height AS "blockHeight",
tx_locktime AS "locktime",
tx_version AS "version"
FROM tx_view
WHERE tx_hash IN ({{txIds | join(',')}})
