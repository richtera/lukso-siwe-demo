import { useCallback, useContext } from 'react';
import JSONView from 'react-json-view';

import { SignMessageContext } from './SignMessage';

export function ShowSession() {
  const { data, setData } = useContext(SignMessageContext);
  const onClick = useCallback(() => {
    setData({});
  }, [setData]);
  return (
    <div className="shadow-lg rounded-2xl m-3 p-5 bg-white">
      <h3 className="text-md">Session (localStorage)</h3>
      <button
        className="rounded border-solid border-2 border-sky-500 disabled:text-gray-300 disabled:border-gray-200 disabled:bg-gray-100 px-2"
        disabled={Object.keys(data).length === 0}
        onClick={onClick}
      >
        Clear
      </button>
      <div className="w-full overflow-auto">
        <JSONView name="localStorage.session" src={data} />
      </div>
    </div>
  );
}
