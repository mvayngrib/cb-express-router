SELECT tx_hash, tx_version, tx_locktime, block_hash, block_height
FROM tx_view
INNER JOIN block_tx
USING (tx_hash)
INNER JOIN block
USING (block_hash)
WHERE tx_hash IN ({{txIds | join(',')}}) and block_in_longest = true
