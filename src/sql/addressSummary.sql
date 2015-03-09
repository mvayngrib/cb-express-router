{% for address in addresses %}
SELECT
addr_bs58 AS "address",
COALESCE(confirmed.confirmed_balance, 0) + COALESCE(unconfirmed.unconfirmed_balance, 0) AS "balance",
COALESCE(confirmed.confirmed_received_amount, 0) + COALESCE(unconfirmed.unconfirmed_received_amount, 0) AS "totalReceived", 
COALESCE(confirmed.confirmed_tx_count, 0) + COALESCE(unconfirmed.unconfirmed_tx_count, 0) AS "txCount"
FROM addr_summary AS confirmed
FULL JOIN unconfirmed_addr_summary AS unconfirmed
USING (addr_bs58)
WHERE addr_bs58 = {{address|safe}}
{% if loop.last !== true %}
UNION ALL
{% endif %}
{% endfor %}
