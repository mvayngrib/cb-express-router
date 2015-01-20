{% for txId in txIds %}
	SELECT *
	FROM txin
	WHERE tx_hash = '{{txId}}'
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
