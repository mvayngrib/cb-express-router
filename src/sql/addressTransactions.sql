SELECT *
FROM addr_tx_view
WHERE addr_bs58 IN ( {{addresses | join(',')}} )
