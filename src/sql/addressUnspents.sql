SELECT * FROM
(
	{% if type !== "multisig" %}
	(
		SELECT *
		FROM unspent_txout_view
		WHERE unspent_txout_view.addr_bs58 IN (
			{% for address in addresses %}
				'{{address|safe}}'
				{% if loop.last !== true %},{% endif %}
			{% endfor %}
		)
	)
	UNION ALL
	{% endif %}
	(
		SELECT unspent_txout_view.*
		FROM unspent_txout_view
		LEFT JOIN multisig_addr
		USING (tx_hash, txout_pos)
		WHERE multisig_addr.addr_bs58 IN (
			{% for address in addresses %}
				'{{address|safe}}'
				{% if loop.last !== true %},{% endif %}
			{% endfor %}
		)
	)
)
all_unspents
