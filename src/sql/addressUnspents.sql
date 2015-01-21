SELECT *
FROM unspent_txout_view
WHERE addr_bs58 IN ( {{addresses | join(',')}} )
