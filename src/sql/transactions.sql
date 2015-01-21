SELECT * FROM tx_view WHERE tx_hash IN ( {{txIds | join(',')}} )
