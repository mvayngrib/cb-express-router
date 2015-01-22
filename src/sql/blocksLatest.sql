SELECT 
block_hash AS "blockId",
prev_block_hash AS "prevBlockId",
block_hashmerkleroot AS "merkleRootHash",
block_nonce::bigint AS "nonce",
block_version::bigint AS "version",
block_height::bigint AS "blockHeight",
block_bits::bigint AS "blockSize",
block_timestamp::bigint AS "timestamp",
block_tx_count::bigint AS "txCount"
FROM block_view
WHERE block_in_longest = true
ORDER BY block_height DESC
LIMIT {{limit}}
