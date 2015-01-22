SELECT
tx_hash AS "txId",
block_hash AS "blockId",
block_height::bigint AS "blockHeight",
tx_locktime::bigint AS "locktime",
tx_version::bigint AS "version"
FROM addr_tx_view
WHERE addr_bs58 IN ({{addresses | join(',')}})
