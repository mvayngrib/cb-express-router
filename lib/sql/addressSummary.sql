{% for address in addresses %}
SELECT
	COALESCE(confirmed.addr_bs58, unconfirmed.addr_bs58) AS addr_bs58,
	COALESCE(confirmed.confirmed_tx_count, 0::bigint)::bigint AS confirmed_tx_count,
	COALESCE(confirmed.confirmed_balance, 0::bigint)::bigint AS confirmed_balance,
	COALESCE(confirmed.confirmed_received_amount, 0::bigint)::bigint AS confirmed_received_amount,
	COALESCE(unconfirmed.unconfirmed_tx_count, 0::bigint)::bigint AS unconfirmed_tx_count,
	COALESCE(unconfirmed.unconfirmed_balance, 0::bigint)::bigint AS unconfirmed_balance,
	COALESCE(unconfirmed.unconfirmed_received_amount, 0::bigint)::bigint AS unconfirmed_received_amount,
	COALESCE(confirmed.confirmed_tx_count, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_tx_count, 0::bigint)::bigint AS total_tx_count,
	COALESCE(confirmed.confirmed_balance, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_balance, 0::bigint)::bigint AS total_balance,
	COALESCE(confirmed.confirmed_received_amount, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_received_amount, 0::bigint)::bigint AS total_received_amount
FROM (
	SELECT
		addr_summary.addr_bs58,
		addr_summary.confirmed_tx_count,
		addr_summary.confirmed_balance,
		addr_summary.confirmed_received_amount
	FROM addr_summary
	WHERE addr_bs58 = {{address|safe}}
) AS confirmed
FULL JOIN (
	SELECT * FROM unconfirmed_addr_summary
	WHERE addr_bs58 = {{address|safe}}
) As unconfirmed
USING (addr_bs58)
-- End one addr statement
{% if loop.last !== true %}UNION ALL{% endif %}
{% endfor %}
