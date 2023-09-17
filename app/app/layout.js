"use client"

import { Analytics } from "@vercel/analytics/react";
import "../styles/globals.css";

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export const metdata = {
  title: "Llama Chat",
  openGraph: {
    title: "Llama Chat",
    description: "Chat with Llama 2",
  },
};

export default function RootLayout({ children }) {

  //connect wallet
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = clusterApiUrl(network);
  
    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];


  return (
    <html>
      <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
      <head>
        <title>Chat with Llama 2</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦙</text></svg>"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
      </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
    </html>
  );
}
