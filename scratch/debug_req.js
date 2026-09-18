import http from 'http';

const login = async () => {
  return new Promise((resolve) => {
    const req = http.request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d).token));
    });
    req.write(JSON.stringify({ email: 'admin@medisync.local', password: 'Admin@2026!' }));
    req.end();
  });
};

const run = async () => {
  const token = await login();
  console.log('Got admin token');

  const testGet = (path) => new Promise((resolve) => {
    const req = http.request(`http://localhost:5000/api${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`GET ${path} -> ${res.statusCode}:`, d);
        resolve();
      });
    });
    req.end();
  });

  await testGet('/dashboard');
  await testGet('/reports/summary');
};

run();
