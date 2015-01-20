{% for address in addresses %}
	SELECT *
	FROM addr_summary
	LEFT JOIN unconfirmed_addr_summary
	USING (addr_bs58)
	WHERE addr_bs58 = '{{address}}'
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
