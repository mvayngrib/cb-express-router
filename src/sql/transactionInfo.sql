{% for txId in txIds %}
	SELECT tx_hash, tx_version, tx_locktime, block_hash, block_height
	FROM tx
	INNER JOIN block_tx
	USING (tx_hash)
	INNER JOIN block
	USING (block_hash)
	WHERE tx_hash = '{{txId}}' and block_in_longest = true
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
