import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Temporarily disable COEP to allow FHEVM relayer communication
          // TODO: Re-enable COEP once FHEVM supports it properly
          // {
          //   key: 'Cross-Origin-Embedder-Policy',
          //   value: 'require-corp',
          // },
          // Allow all origins for FHEVM development
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          // Allow FHEVM relayer connections, wallet connections, and development resources
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.zama.ai https://relayer.testnet.zama.cloud; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://relayer.testnet.zama.cloud https://sepolia.infura.io wss://sepolia.infura.io https://cdn.zama.ai https://cca-lite.coinbase.com https://11155111.rpc.thirdweb.com https://pulse.walletconnect.org https://api.web3modal.org wss://relay.walletconnect.org http://127.0.0.1:8545 https://*.s3.eu-west-1.amazonaws.com https://*.s3.amazonaws.com; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
