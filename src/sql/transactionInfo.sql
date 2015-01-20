{% for txId in txIds %}
	SELECT *
	FROM tx
	LEFT JOIN block_tx
	USING (tx_hash)
	LEFT JOIN block
	USING (block_hash)
	WHERE tx_hash = '{{txId}}' and block_in_longest = true
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
