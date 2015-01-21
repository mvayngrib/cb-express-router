SELECT * FROM block_view WHERE block_hash IN ( {{blockIds | join(',')}} )
