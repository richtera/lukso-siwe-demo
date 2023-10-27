import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { recoverMessageAddress, toHex } from "viem";
import { type Address, useSignMessage, useAccount, useChainId } from "wagmi";
import base64url from "base64url";
import JSONView from "react-json-view";

export function createJwt(message: string, signature: `0x${string}`): string {
  const header = {
    alg: "ES256K",
    typ: "JWT",
  };
  return [
    Buffer.from(JSON.stringify(header)),
    Buffer.from(message),
    Buffer.from(signature.slice(2), "hex"),
  ]
    .map((d) => base64url(d, "base64"))
    .join(".");
}

export function SignMessage() {
  const [data, setData] = useState<any>();
  const {
    data: signature,
    variables,
    error,
    isLoading,
    signMessage,
  } = useSignMessage();
  const account = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    (async () => {
      if (variables?.message && signature) {
        const newJwt = createJwt(variables?.message, signature);
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature,
        });
        setData((value: any) => ({
          ...value,
          localTest: { recoveredAddress },
        }));

        const serverJwt = await fetch("/exchange", {
          headers: {
            Authorization: `Bearer ${newJwt}`,
          },
        })
          .then((response) => response.json())
          .then(({ jwt }) => {
            return jwt;
          });
        setData((value: any) => ({
          ...value,
          server: { ...value?.server, jwt: serverJwt },
        }));

        const serverValid = await fetch("/verify", {
          headers: {
            Authorization: `Bearer ${serverJwt}`,
          },
        })
          .then((response) => response.json())
          .then(({ valid }) => {
            return valid;
          });
        setData((value: any) => ({
          ...value,
          server: { ...value?.server, jwt: serverJwt, valid: serverValid },
        }));

        {
          const [header, message, signature] = serverJwt
            .split(".")
            .map((d: string) => base64url.toBuffer(d));

          const serverAddress = await fetch("/.well-known/public-key")
            .then((response) => response.json())
            .then(({ address }) => address);

          try {
            const serverValid = await recoverMessageAddress({
              message: message.toString(),
              signature: toHex(signature),
            }).then((address) => {
              return address === serverAddress;
            });
            setData((value: any) => ({ ...value, client: { serverValid } }));
          } catch (error) {
            console.error(error);
            setData((value: any) => ({
              ...value,
              client: { serverValid: (error as any).message },
            }));
          }
        }
      }
    })();
  }, [signature, variables?.message]);

  return (
    <div style={{ marginLeft: 30 }}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const element = event.target as HTMLFormElement;
          const formData = new FormData(element);
          const statement = formData.get("message") as string;

          const message = new SiweMessage({
            domain: import.meta.env.VITE_APP_DOMAIN,
            uri: `https://${import.meta.env.VITE_APP_DOMAIN}`,
            statement,
            address: account.address,
            issuedAt: new Date().toISOString(),
            version: "1",
            expirationTime: new Date(Date.now() + 10_000).toISOString(),
            chainId,
          });
          console.log(message);
          signMessage({ message: message.prepareMessage() });
          setData((value: any) => ({
            ...value,
            source: { statement, message },
          }));
        }}
      >
        <input name="message" type="text" required />
        <button disabled={isLoading} type="submit">
          {isLoading ? "Check Wallet" : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 30 }}>
        <JSONView src={data} />
      </div>

      {error && <div>Error: {error?.message}</div>}
    </div>
  );
}
