const http = require('http');

const postData = JSON.stringify({
  email: 'admin',
  password: 'p@sswor1'
});

const req = http.request('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.write(postData);
req.end();
