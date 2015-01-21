SELECT
addr_bs58 AS "address",
COALESCE(confirmed.confirmed_balance, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_balance, 0::bigint)::bigint AS "balance",
COALESCE(confirmed.confirmed_received_amount, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_received_amount, 0::bigint)::bigint AS "totalReceived", 
COALESCE(confirmed.confirmed_tx_count, 0::bigint)::bigint + COALESCE(unconfirmed.unconfirmed_tx_count, 0::bigint)::bigint AS "txCount"
FROM addr_summary AS confirmed
LEFT JOIN unconfirmed_addr_summary AS unconfirmed
USING (addr_bs58)
WHERE addr_bs58 IN ({{addresses | join(',')}})
