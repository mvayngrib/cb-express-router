{% for address in addresses %}
	SELECT *
	FROM unspent_txout_view
	WHERE unspent_txout_view.addr_bs58 = '{{address}}' 
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
