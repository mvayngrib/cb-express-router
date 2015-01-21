SELECT *
FROM addr_summary
LEFT JOIN unconfirmed_addr_summary
USING (addr_bs58)
WHERE addr_bs58 IN ( {{addresses | join(',')}} )
