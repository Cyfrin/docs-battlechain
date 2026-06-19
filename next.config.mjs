/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/battlechain/quickstart/security-demo',
        destination: '/battlechain/quickstart/one-prompt-demo',
        permanent: true,
      },
      {
        source: '/battlechain/quickstart/ai-quickstart',
        destination: '/battlechain/quickstart/deploy-your-contract',
        permanent: true,
      },
      {
        source: '/battlechain/quickstart/deploy-first-contract',
        destination: '/battlechain/quickstart/deploy-your-contract',
        permanent: true,
      },
      {
        source: '/battlechain/quickstart/configure-ai-tools',
        destination: '/battlechain/how-to/configure-ai-tools',
        permanent: true,
      },
      {
        source: '/battlechain/how-to/use-ai-with-docs',
        destination: '/battlechain/using-battlechain-with-ai',
        permanent: true,
      },
      {
        source: '/battlechain/tutorials/prediction-market',
        destination: '/overview',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
