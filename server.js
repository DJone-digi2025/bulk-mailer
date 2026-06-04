const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

let transporter = null;
let gmailUser = null;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

if (req.method === 'POST' && req.url === '/connect') {
  console.log('CONNECT REQUEST RECEIVED');

  let body = '';

  req.on('data', chunk => body += chunk);

  req.on('end', async () => {
    try {
      console.log('BODY RECEIVED');

      const { email, appPassword } = JSON.parse(body);

      console.log('VERIFYING SMTP...');

transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: email,
    pass: appPassword
  }
});

console.log('SMTP CREATED');

gmailUser = email;

res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({
  success: true,
  email
}));

    } catch (err) {
      console.error('CONNECT ERROR:', err);

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: err.message
      }));
    }
  });

  return;
}

  if (req.method === 'POST' && req.url === '/send') {
    if (!transporter) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not connected' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { to, subject, text } = JSON.parse(body);
        console.log(`SENDING TO ${to}`);

const info = await transporter.sendMail({
  from: gmailUser,
  to,
  subject,
  text
});

console.log('MAIL SENT:', info.messageId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } 
catch (err) {
  console.error('SEND ERROR:', err);

  res.writeHead(500, {
    'Content-Type': 'application/json'
  });

  res.end(JSON.stringify({
    success: false,
    error: err.message,
    code: err.code,
    command: err.command
  }));
}
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Bulk Mailer running on port ${PORT}`);
});
