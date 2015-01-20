{% for txId in txIds %}
	SELECT tx_hash, txout_pos, txout_value, txout_scriptpubkey
	FROM txout
	WHERE tx_hash = '{{txId}}'
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
