SELECT tx_hash, txout_pos, txout_value, txout_scriptpubkey
FROM txout_view
WHERE tx_hash IN ({{txIds | join(',')}})
