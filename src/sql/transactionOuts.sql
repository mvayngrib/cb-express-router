{% for txId in txIds %}
	SELECT *
	FROM txout
	WHERE tx_hash = '{{txId}}'
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
