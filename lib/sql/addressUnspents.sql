SELECT
tx_hash AS "txId",
confirmations AS "confirmations",
addr_bs58 AS "address",
txout_value AS "value",
txout_pos AS "vout"
FROM unspent_txout_view
WHERE addr_bs58 IN ({{addresses | join(',')}})
