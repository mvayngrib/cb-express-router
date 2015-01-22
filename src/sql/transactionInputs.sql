SELECT 
tx_hash AS "txId",
txin_pos::bigint AS "n",
prev_tx_hash AS "prevTxId",
prev_txout_value::bigint AS "value",
prev_txout_pos::bigint AS "vout",
txin_scriptsig AS "scriptSig",
txin_sequence::bigint AS "sequence"
FROM txin_view
WHERE tx_hash IN ({{txIds | join(',')}})
