SELECT tx_hash, txin_pos, prev_tx_hash, prev_txout_pos, txin_scriptsig, txin_sequence
FROM txin_view
WHERE tx_hash IN ({{txIds | join(',')}})
