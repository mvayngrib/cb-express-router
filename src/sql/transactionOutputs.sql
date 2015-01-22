SELECT 
tx_hash AS "txId",
txout_pos::bigint AS "n",
txout_scriptpubkey AS "scriptPubKey",
txout_value::bigint AS "value"
FROM txout_view
WHERE tx_hash IN ({{txIds | join(',')}})
