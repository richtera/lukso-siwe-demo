import { createContext, useCallback, useState } from 'react';

import { ClientVerifyJwt } from './ClientVerifyJwt';
import { CreateJwt } from './CreateJwt';
import { ExchangeToken } from './ExchangeToken';
import { ServerVerifyJwt } from './ServerVerifyJwt';
import { ShowSession } from './ShowSession';

export const SignMessageContext = createContext<{
  data: any;
  setData: ReturnType<typeof useState<any>>[1];
}>({
  data: {},
  setData: () => {},
});

export function SignMessage() {
  const [data, setData_] = useState<any>(() => {
    return JSON.parse(localStorage.getItem('sessionData') || '{}');
  });
  const setData = useCallback((value: any) => {
    setData_((data: any) => {
      const newData = typeof value === 'function' ? value(data) : value;
      localStorage.setItem('sessionData', JSON.stringify(newData));
      return newData;
    });
  }, []);
  return (
    <SignMessageContext.Provider value={{ data, setData }}>
      <CreateJwt title="Sign Client Token" /> <hr />
      <ClientVerifyJwt
        jwt={data?.client?.jwt}
        title="Verify Client token on Client"
      />
      <ServerVerifyJwt
        jwt={data?.client?.jwt}
        title="Verify Client token on Server"
      />
      <ExchangeToken
        jwt={data?.client?.jwt}
        onToken={(jwt) =>
          setData((value: any) => ({ ...value, server: { jwt } }))
        }
        title="Retrieve Server token from Client token"
      />
      <ClientVerifyJwt
        jwt={data?.server?.jwt}
        title="Verify Server token on Client"
      />
      <ExchangeToken
        jwt={data?.server?.jwt}
        onToken={(jwt) =>
          setData((value: any) => ({ ...value, server: { jwt } }))
        }
        title="Refresh Server token"
      />
      <ServerVerifyJwt
        jwt={data?.server?.jwt}
        title="Verify Server token on Server"
      />
      <ShowSession />
    </SignMessageContext.Provider>
  );
}
