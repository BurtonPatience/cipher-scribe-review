
/*
  This file is auto-generated.
  Command: 'npm run genabi'
  To override contract addresses, set environment variables:
  - NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN_ID>=0x...
*/
export const CipherScribeReviewABI = {
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "InvalidMetadata",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "NoScoresYet",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "PaperAlreadyRegistered",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "PaperNotFound",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "reviewer",
          "type": "address"
        }
      ],
      "name": "ReviewerAlreadySubmitted",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "requester",
          "type": "address"
        }
      ],
      "name": "FinalScorePrepared",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "track",
          "type": "string"
        }
      ],
      "name": "PaperRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "track",
          "type": "string"
        }
      ],
      "name": "PaperUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "reviewer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "reviewCount",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "timestamp",
          "type": "uint64"
        }
      ],
      "name": "ScoreSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "requester",
          "type": "address"
        }
      ],
      "name": "TotalHandleShared",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MAX_SCORE",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_SCORE",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "getPaper",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bytes32",
              "name": "paperId",
              "type": "bytes32"
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "track",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "authorHash",
              "type": "string"
            },
            {
              "internalType": "uint32",
              "name": "reviewCount",
              "type": "uint32"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "uint64",
              "name": "updatedAt",
              "type": "uint64"
            }
          ],
          "internalType": "struct CipherScribeReview.PaperStats",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPaperIds",
      "outputs": [
        {
          "internalType": "bytes32[]",
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "getPlainSum",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "listPapers",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bytes32",
              "name": "paperId",
              "type": "bytes32"
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "track",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "authorHash",
              "type": "string"
            },
            {
              "internalType": "uint32",
              "name": "reviewCount",
              "type": "uint32"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "uint64",
              "name": "updatedAt",
              "type": "uint64"
            }
          ],
          "internalType": "struct CipherScribeReview.PaperStats[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "prepareFinalScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "track",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "authorHash",
          "type": "string"
        }
      ],
      "name": "registerPaper",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "reviewerHasSubmitted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        }
      ],
      "name": "shareEncryptedTotal",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedScore",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "submitScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "paperId",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "track",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "authorHash",
          "type": "string"
        }
      ],
      "name": "updatePaperMetadata",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

