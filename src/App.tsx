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
      <h1 className="text-lg">Login using SIWE with Universal Profile</h1>
      <h2 className="text-md">
        Create signatures as JWT tokens, validate them from client to server and
        server to client.{' '}
        {isConnected ? '' : 'Please connect the Universal Profile Extension.'}
      </h2>

      {isConnected && <SignMessage />}
    </div>
  );
}
