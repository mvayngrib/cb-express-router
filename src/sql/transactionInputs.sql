SELECT 
tx_hash AS "txId",
txin_pos AS "n",
prev_tx_hash AS "prevTxId",
prev_txout_value AS "value",
prev_txout_pos AS "vout",
txin_scriptsig AS "scriptSig",
txin_sequence AS "sequence"
FROM txin_view
WHERE tx_hash IN ({{txIds | join(',')}})
