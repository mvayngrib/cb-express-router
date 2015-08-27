var typeforce = require('typeforce')

function bs58 (value) {
  return typeforce.String(value) && /^[1-9A-HJ-NP-Za-km-z]{26,35}$/.test(value)
}

function hash256 (value) {
  return typeforce.String(value) && /^[0-9a-f]{64}$/i.test(value)
}

function hex (value) {
  return typeforce.String(value) && /^([0-9a-f]{2})+$/i.test(value)
}

module.exports = {
  'addresses': {
    'summary': {
      'arguments': {
        'addresses': [bs58]
      },
      'expected': [
        {
          'address': bs58,
          'balance': 'Number',
          'totalReceived': 'Number',
          'txCount': 'Number'
        }
      ]
    },
    'transactions': {
      'arguments': {
        'addresses': [bs58],
        'blockHeight': '?Number'
      },
      'expected': [
        {
          'blockHeight': '?Number',
          'blockId': typeforce.maybe(hex),
          'txHex': hex,
          'txId': hash256
        }
      ]
    },
    'unspents': {
      'arguments': {
        'addresses': [bs58]
      },
      'expected': [
        {
          'address': bs58,
          'confirmations': 'Number',
          'txId': hash256,
          'value': 'Number',
          'vout': 'Number'
        }
      ]
    }
  },
  'blocks': {
    'get': {
      'arguments': {
        'blockIds': [hash256]
      },
      'expected': [
        {
          'blockHex': hex,
          'blockId': hash256
        }
      ]
    },
    'latest': {
      'arguments': {},
      'expected': {
        'blockHeight': 'Number',
        'blockId': hash256,
        'blockSize': 'Number',
        'bits': '?Number',
        'merkleRootHash': hash256,
        'nonce': 'Number',
        'prevBlockId': hash256,
        'timestamp': 'Number',
        'txCount': 'Number',
        'version': 'Number'
      }
    },
    'propagate': {
      'arguments': {
        'blockHex': hex
      },
      'expected': {}
    },
    'summary': {
      'arguments': {
        'blockIds': [hash256]
      },
      'expected': [
        {
          'blockHeight': 'Number',
          'blockId': hash256,
          'blockSize': 'Number',
          'bits': '?Number',
          'merkleRootHash': hash256,
          'nonce': 'Number',
          'prevBlockId': hash256,
          'timestamp': 'Number',
          'txCount': 'Number',
          'version': 'Number'
        }
      ]
    }
  },
  'transactions': {
    'get': {
      'arguments': {
        'txIds': [hash256]
      },
      'expected': [
        {
          'blockHeight': '?Number',
          'blockId': typeforce.maybe(hash256),
          'txHex': hex,
          'txId': hash256
        }
      ]
    },
    'latest': {
      'arguments': {},
      'expected': [
        {
          'txHex': hex,
          'txId': hash256
        }
      ]
    },
    'propagate': {
      'arguments': {
        'txHexs': [hex]
      },
      'expected': [hash256]
    },
    'summary': {
      'arguments': {
        'txIds': [hash256]
      },
      'expected': [
        {
          'blockHeight': '?Number',
          'blockId': typeforce.maybe(hash256),
          'nInputs': 'Number',
          'nOutputs': 'Number',
          'totalInputValue': 'Number',
          'totalOutputValue': 'Number',
          'txId': hash256
        }
      ]
    }
  }
}
