import { Web3Button } from "@web3modal/react";
import { useAccount } from "wagmi";

import { SignMessage } from "./components/SignMessage";

export function App() {
  const { isConnected } = useAccount();

  return (
    <div style={{ marginLeft: 20, marginTop: 20 }}>
      <h1>Login using SIWE with Universal Profile</h1>
      <h2>
        Create signatures as JWT tokens, validate them from client to server and
        server to client.
      </h2>

      <Web3Button />

      {isConnected && (
        <>
          <h3>Login</h3>
          <SignMessage />
        </>
      )}
    </div>
  );
}
