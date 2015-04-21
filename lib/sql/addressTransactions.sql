{% for address in addresses %}
SELECT
tx_hash AS "txId",
block_hash AS "blockId",
block_height AS "blockHeight",
tx_locktime AS "locktime",
tx_version AS "version"
FROM addr_tx_view
WHERE addr_bs58 = {{address|safe}}
{% if loop.last !== true %}
UNION ALL
{% endif %}
{% endfor %}