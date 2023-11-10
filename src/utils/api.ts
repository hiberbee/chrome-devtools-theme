async function send({ method, path, data = null, token }) {
  const fetch = window.fetch;

  const opts: RequestInit = { method, headers: {} };

  if (data) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }

  if (token) {
    opts.headers['Authorization'] = `Token ${token}`;
  }

  let r = await fetch(`${path}`, opts);
  let json: string = await r.text();
  try {
    return JSON.parse(json);
  } catch (err) {
    return json;
  }
}

export function get(path: string, token: string) {
  return send({ method: 'GET', path, token });
}

export function del(path: string, token: string) {
  return send({ method: 'DELETE', path, token });
}

export function post(path: string, data: unknown, token: string) {
  return send({ method: 'POST', path, data, token });
}

export function put(path: string, data: unknown, token: string) {
  return send({ method: 'PUT', path, data, token });
}
