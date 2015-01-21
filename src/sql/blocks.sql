SELECT 
block_hash AS "blockId",
prev_block_hash AS "prevBlockId",
block_hashmerkleroot AS "merkleRootHash",
block_nonce AS "nonce",
block_version AS "version",
block_height AS "blockHeight",
block_bits AS "blockSize",
block_timestamp AS "timestamp",
block_tx_count AS "txCount"
FROM block_view
WHERE block_hash IN ({{blockIds | join(',')}})
