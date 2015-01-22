SELECT
tx_hash AS "txId",
confirmations::bigint AS "confirmations",
addr_bs58 AS "address",
txout_value::bigint AS "value",
txout_pos::bigint AS "vout"
FROM unspent_txout_view
WHERE addr_bs58 IN ({{addresses | join(',')}})
