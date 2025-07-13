import "@/styles/globals.css";
import { HeroUIProvider } from "@heroui/react";

import '@near-wallet-selector/modal-ui/styles.css';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupEthereumWallets } from '@near-wallet-selector/ethereum-wallets';
import { WalletSelectorProvider } from '@near-wallet-selector/react-hook';
import { HelloNearContract, NetworkId } from '../config';

// ethereum wallets
import { wagmiConfig, web3Modal } from '../wallets/web3modal';

const walletSelectorConfig = {
  network: NetworkId,
  modules: [
    setupEthereumWallets({ wagmiConfig, web3Modal }),
    setupMyNearWallet(),
  ],
}

export default function App({ Component, pageProps }) {
  return (
    <WalletSelectorProvider config={walletSelectorConfig}>
      <HeroUIProvider>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
        </div>
      </HeroUIProvider>
    </WalletSelectorProvider>
  );
}
