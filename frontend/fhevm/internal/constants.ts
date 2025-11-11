// Try multiple CDN URLs in case one fails
export const SDK_CDN_URLS = [
  "https://cdn.zama.ai/relayer-sdk-js/0.3.0/relayer-sdk-js.umd.cjs",
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs",
  "https://cdn.jsdelivr.net/npm/@zama-fhe/relayer-sdk@0.3.0/bundle/index.umd.cjs"
];

export const SDK_CDN_URL = SDK_CDN_URLS[0]; // Use first URL as default
