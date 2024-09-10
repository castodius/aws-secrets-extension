const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2020-01-01/extension`;

const call = async (path: string, init: RequestInit) => {
  return fetch(`${baseUrl}${path}`, init)
}

export const register = async () => {
  const res = await call(`/register`, {
    method: 'post',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json',
      'Lambda-Extension-Name': 'index.mjs',
    }
  });

  if (!res.ok) {
    console.error('register failed', await res.text());
  }

  return res.headers.get('lambda-extension-identifier')!;
}

export const next = async (extensionId: string) => {
  const res = await call(`/event/next`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Lambda-Extension-Identifier': extensionId,
    }
  });

  if (!res.ok) {
    console.error('next failed', await res.text());
    return null;
  }

  return await res.json();
}