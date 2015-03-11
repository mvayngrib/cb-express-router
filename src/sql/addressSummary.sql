{% for address in addresses %}
SELECT
  COALESCE(confirmed.addr_bs58, unconfirmed.addr_bs58) AS "address",
  COALESCE(confirmed.confirmed_tx_count, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_tx_count, 0::bigint)::bigint AS "txCount",
  COALESCE(confirmed.confirmed_balance, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_balance, 0::bigint)::bigint AS "balance",
  COALESCE(confirmed.confirmed_received_amount, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_received_amount, 0::bigint)::bigint AS "totalReceived"
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
  {% if loop.last !== true %}
    UNION ALL
  {% endif %}
{% endfor %}
