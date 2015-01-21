SELECT *
FROM addr_tx_
WHERE addr_bs58 IN ( {{addresses | join(',')}} )
