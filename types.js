var typeforce = require('typeforce')

function Base58Address (value) {
  return typeforce.String(value) && /^[1-9A-HJ-NP-Za-km-z]{26,35}$/.test(value)
}

function Hex (value) {
  return typeforce.String(value) && /^([0-9a-f]{2})+$/i.test(value)
}

function Hex256bit (value) {
  return typeforce.String(value) && /^[0-9a-f]{64}$/i.test(value)
}

module.exports = {
  'addresses': {
    'summary': {
      'arguments': {
        'addresses': [Base58Address]
      },
      'expected': [
        {
          'address': Base58Address,
          'balance': 'Number',
          'totalReceived': 'Number',
          'txCount': 'Number'
        }
      ]
    },
    'transactions': {
      'arguments': {
        'addresses': [Base58Address],
        'blockHeight': '?Number'
      },
      'expected': [
        {
          'blockHeight': '?Number',
          'blockId': typeforce.maybe(Hex256bit),
          'txHex': Hex,
          'txId': Hex256bit
        }
      ]
    },
    'unspents': {
      'arguments': {
        'addresses': [Base58Address]
      },
      'expected': [
        {
          'address': Base58Address,
          'confirmations': 'Number',
          'txId': Hex256bit,
          'value': 'Number',
          'vout': 'Number'
        }
      ]
    }
  },
  'blocks': {
    'get': {
      'arguments': {
        'blockIds': [Hex256bit]
      },
      'expected': [
        {
          'blockHex': Hex,
          'blockId': Hex256bit
        }
      ]
    },
    'latest': {
      'arguments': {},
      'expected': {
        'blockHeight': 'Number',
        'blockId': Hex256bit,
        'blockSize': 'Number',
        'bits': '?Number',
        'merkleRootHash': Hex256bit,
        'nonce': 'Number',
        'prevBlockId': Hex256bit,
        'timestamp': 'Number',
        'txCount': 'Number',
        'version': 'Number'
      }
    },
    'propagate': {
      'arguments': {
        'blockHex': Hex
      },
      'expected': {}
    },
    'summary': {
      'arguments': {
        'blockIds': [Hex256bit]
      },
      'expected': [
        {
          'blockHeight': 'Number',
          'blockId': Hex256bit,
          'blockSize': 'Number',
          'bits': '?Number',
          'merkleRootHash': Hex256bit,
          'nonce': 'Number',
          'prevBlockId': Hex256bit,
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
        'txIds': [Hex256bit]
      },
      'expected': [
        {
          'blockHeight': '?Number',
          'blockId': typeforce.maybe(Hex256bit),
          'txHex': Hex,
          'txId': Hex256bit
        }
      ]
    },
    'latest': {
      'arguments': {},
      'expected': [
        {
          'txHex': Hex,
          'txId': Hex256bit
        }
      ]
    },
    'propagate': {
      'arguments': {
        'txHexs': [Hex]
      },
      'expected': [Hex256bit]
    },
    'summary': {
      'arguments': {
        'txIds': [Hex256bit]
      },
      'expected': [
        {
          'blockHeight': '?Number',
          'blockId': typeforce.maybe(Hex256bit),
          'nInputs': 'Number',
          'nOutputs': 'Number',
          'totalInputValue': 'Number',
          'totalOutputValue': 'Number',
          'txId': Hex256bit
        }
      ]
    }
  }
}
