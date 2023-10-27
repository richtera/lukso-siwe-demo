This demo uses amongst other thing [wagmi](https://wagmi.sh) + [Web3Modal](https://web3modal.com/) + [Vite](https://vitejs.dev/) project bootstrapped with [`create-wagmi`](https://github.com/wagmi-dev/wagmi/tree/main/packages/create-wagmi)

# Getting Started

Install `pnpm` and `nodejs` (use asdf or nvm to get the right)
Run `pnpm install`
Run `pnpm run typegen` (one time to bootstrap the typechain wrappers for lsp-smart-contracts)
Run `pnpm run dev` in your terminal, and then open [https://localhost:5173](https://localhost:5173) in your browser.

Once the webpage has loaded, changes made to files inside the `src/` and `server/` directories (e.g. `src/App.tsx`) will automatically update the webpage and server.
The server is a small fastify server which allows token exchange and verify of JWT tokens.

# Learn more

To learn more about [Vite](https://vitejs.dev/) or [wagmi](https://wagmi.sh), check out the following resources:

- [wagmi Documentation](https://wagmi.sh) – learn about wagmi Hooks and API.
- [wagmi Examples](https://wagmi.sh/examples/connect-wallet) – a suite of simple examples using wagmi.
- [Web3Modal Documentation](https://web3modal.com) – learn more about Web3Modal (configuration, theming, advanced usage, etc).
- [Vite Documentation](https://vitejs.dev/) – learn about Vite features and API.
