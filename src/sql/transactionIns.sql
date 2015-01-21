SELECT * FROM txin_view WHERE tx_hash IN ( {{txIds | join(',')}} )
