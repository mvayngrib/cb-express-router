SELECT * FROM txout_view WHERE tx_hash IN ( {{txIds | join(',')}} )
