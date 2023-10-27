import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { WagmiConfig } from "wagmi";

import { App } from "./App";
import { config, chains, walletConnectProjectId } from "./wagmi";
import { EthereumClient } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";

const ethereumClient = new EthereumClient(config, chains);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App />
      <Web3Modal
        projectId={walletConnectProjectId}
        ethereumClient={ethereumClient}
      />
    </WagmiConfig>
  </React.StrictMode>
);
