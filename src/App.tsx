import { Web3Button } from '@web3modal/react';
import { useAccount } from 'wagmi';

import { SignMessage } from './components/SignMessage';

export function App() {
  const { isConnected } = useAccount();

  return (
    <div className="container mx-auto p-4 bg-slate-300">
      <nav className="flex justify-between items-center">
        <Web3Button />
      </nav>
      <h1 className="text-lg">
        Web3 Auth: Using Universal Profile and SIWE for Login
      </h1>
      <h2 className="text-md">
        This webpage shows several basic functions needed to use Universal
        Profiles and SIWE for authentication, authorization and verification.
        Create signatures as JWT tokens, validate them from client to server and
        server to client.{' '}
        {isConnected ? (
          ''
        ) : (
          <span className="text-red bg-gray-500">
            Please connect the Universal Profile Extension.
          </span>
        )}
      </h2>

      {isConnected && <SignMessage />}
    </div>
  );
}
