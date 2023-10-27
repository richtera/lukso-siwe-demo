/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import fastifyCors from "@fastify/cors";
import formBody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import { Signature } from "@noble/secp256k1";
import { config } from "dotenv";
import crypto from "node:crypto";
import path from "node:path";
import {
  JsonRpcProvider,
  getAddress,
  hexlify,
  keccak256,
  Contract,
  HDNodeWallet,
  SigningKey,
} from "ethers";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { SiweMessage } from "siwe";
import { exportJWK, importSPKI } from "jose";
import base64url from "base64url";
import { LSP0ERC725AccountInit__factory } from "../libs/contracts/factories/LSP0ERC725AccountInit__factory.js";
import { hashMessage, verifyMessage } from "viem";

config();

const fastify = Fastify({
  logger: true,
  ...(process.env.ENABLE_HTTP2 === "true" ? { http2: true } : {}),
});
await fastify.register(formBody);
await fastify.register(fastifyCors, {
  // put your options here
});
// eslint-disable-next-line unicorn/no-null
fastify.decorateRequest("user", null);
// eslint-disable-next-line unicorn/no-null
fastify.decorateRequest("tags", null);
// eslint-disable-next-line unicorn/no-null
fastify.decorateRequest("scope", null);

// now let's create a router (note the lack of "new")
const provider = new JsonRpcProvider("https://rpc.testnet.lukso.network");

if (!process.env.VITE_MNEMONIC) {
  const wallet = HDNodeWallet.createRandom();
  const phrase = wallet.mnemonic?.phrase;
  console.log(phrase);
  console.log(
    `Please configure your .env with\nVITE_MNEMONIC=${phrase}\nor any other mnemonic you want to use.\nStarting up with random new phrase above.\nThis private/public key pair is used to sign and verify server tokens.`
  );
  process.env.VITE_MNEMONIC = phrase;
}

const wallet = HDNodeWallet.fromPhrase(process.env.VITE_MNEMONIC || "");

async function getJwks() {
  const pem = wallet.publicKey;
  const { groups: { keyId = "", keyVersion = "" } = {} } =
    /.*\/cryptokeys\/(?<keyId>[\da-z-]+)\/cryptokeyversions\/(?<keyVersion>[\da-z-]+)$/i.exec(
      process.env.SERVER_KEY_PATH || ""
    ) || {};
  const pk = await importSPKI(pem as string, "ES256K");
  const jwk = await exportJWK(pk);
  return [{ ...jwk, kid: "1" }];
}

fastify.get("/.well-known/jwks", async (_request, reply) => {
  reply
    .code(200)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(await getJwks());
});

fastify.get("/.well-known/public-key", async (_request, reply) => {
  reply
    .code(200)
    .header("Content-Type", "application/json; charset=utf-8")
    .send({
      address: wallet.address,
      publicKey: wallet.publicKey,
    });
});

/**
 * Exchange user message for a server message and jwt
 *
 * @param siwe user siwe message
 * @param uri
 * @param nonce
 * @param domain
 * @param address
 * @returns
 */
async function exchangeToken(
  siwe: SiweMessage,
  uri: string,
  nonce: string,
  domain: string,
  address: string
) {
  const newMessage = new SiweMessage({
    ...siwe,
    uri,
    domain,
    address,
    resources: [
      ...(siwe.resources || []),
      siwe.uri,
      "did:web" + siwe.domain,
      "did:account:" + siwe.address,
    ],
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    nonce,
  });
  const message = newMessage.prepareMessage();
  const signature = await wallet.signMessage(message);
  const header = {
    alg: "ES256K",
    typ: "JWT",
  };
  return {
    jwt: [
      Buffer.from(JSON.stringify(header)),
      Buffer.from(message),
      Buffer.from(signature.slice(2), "hex"),
    ]
      .map((d) => base64url(d, "base64"))
      .join("."),
    message: newMessage,
  };
}

/**
 *
 * @param token jwt token to decode
 * @returns decoded siwe message
 */
async function decodeToken(token: string) {
  if (!token) {
    throw new Error("No token");
  }
  const [_header, message, signature] = token.split(".").map((segment) => {
    return base64url.toBuffer(segment);
  });
  if (!signature || !message || !_header) {
    throw new Error("No token");
  }
  const header = JSON.parse(_header.toString());
  if (header.alg !== "ES256K" || header.typ !== "JWT") {
    throw new Error("Invalid token");
  }

  const messageString = message.toString();

  const message_ = new SiweMessage(messageString);
  if (message_.address === wallet.address) {
    // This is a server token
    const signature_ = hexlify(signature) as `0x${string}`;
    if (
      !(await verifyMessage({
        message: messageString,
        signature: signature_,
        address: message_.address as `0x${string}`,
      }))
    ) {
      throw new Error("Invalid token");
    }
    const account = (
      message_.resources?.find((resource) =>
        resource.startsWith("did:account:")
      ) || ""
    ).replace(/^did:account:/, "");
    return { message: message_, account };
  }
  const account = getAddress(message_.address);
  const contract = LSP0ERC725AccountInit__factory.connect(account, provider);
  const value = await contract.isValidSignature(
    hashMessage(messageString),
    hexlify(signature)
  );
  if (value !== "0x1626ba7e") {
    throw new Error("Invalid token");
  }
  return { account, message: message_ };
}

/**
 * Verify user or server token
 *
 * GET with bearer token in authorization header
 *
 * Returns { message: SiweMessage, valid: boolean } as json
 */
fastify.get("/verify", async (request, reply) => {
  const authorization = request.headers.authorization?.replace(/^bearer /i, "");
  if (!authorization) {
    reply.code(401).send({
      error: "invalid_request",
      error_description: "Missing authorization header",
    });
    return;
  }
  try {
    const message = await decodeToken(authorization);
    return { message, valid: true };
  } catch (error) {
    reply.code(401).send({
      error: (error as any).message,
      error_description: "Invalid authorization header",
    });
  }
});

/**
 * Exchange a user token for a server token
 *
 * GET with bearer token in authorization header
 *
 * Returns { message: SiweMessage, originalMessage: SiweMessage, jwt: string } as JSON
 */
fastify.get("/exchange", async (request, reply) => {
  const authorization = request.headers.authorization?.replace(/^bearer /i, "");
  if (!authorization) {
    reply.code(401).send({
      error: "invalid_request",
      error_description: "Missing authorization header",
    });
    return;
  }
  try {
    const { message, account } = await decodeToken(authorization);
    const { jwt, message: newMessage } = await exchangeToken(
      message,
      `https://${process.env.VITE_APP_DOMAIN}`,
      Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex"),
      process.env.VITE_APP_DOMAIN || "",
      wallet.address
    );
    return { message: newMessage, originalMessage: message, jwt: jwt };
  } catch (error) {
    reply.code(401).send({
      error: (error as any).message,
      error_description: "Invalid authorization header",
    });
  }
});

async function run() {
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
  await fastify.listen({
    host: "::",
    port,
    listenTextResolver: (address) => `Listening on ${address}`,
  });
}

// eslint-disable-next-line unicorn/prefer-top-level-await
run().catch((error) => {
  fastify.log.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
