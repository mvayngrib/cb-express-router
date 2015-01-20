{% for txId in txIds %}
	SELECT tx_hash, txin_pos, prev_tx_hash, prev_txout_pos, txin_scriptsig, txin_sequence
	FROM txin
	WHERE tx_hash = '{{txId}}'
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
