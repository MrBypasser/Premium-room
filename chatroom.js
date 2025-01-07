const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Predefined secure role keys
const ROLE_KEYS = {
  Owner: 'xwf213Dha',
  Alpha: 'a3Bc8zKlm',
  'Epic Man': 'Ep1cM@nKey'
};

// In-memory data stores (for simplicity)
const users = {}; // { username: { password, role } }
const messages = []; // [{ username, message, timestamp }]

// Middleware
app.use(bodyParser.json());

// Serve HTML UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chatroom</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
        h1 { color: #4CAF50; }
        .container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 5px; }
        input, button { margin: 5px 0; padding: 10px; width: 100%; box-sizing: border-box; }
        button { background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        .chat { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
        .message { margin-bottom: 10px; }
        .message span { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to the Chatroom</h1>
        <div id="auth">
          <h3>Create Account</h3>
          <input id="username" type="text" placeholder="Username" />
          <input id="password" type="password" placeholder="Password" />
          <input id="key" type="text" placeholder="Role Key (optional)" />
          <button onclick="createAccount()">Create Account</button>
          <h3>Login</h3>
          <input id="loginUsername" type="text" placeholder="Username" />
          <input id="loginPassword" type="password" placeholder="Password" />
          <button onclick="login()">Login</button>
        </div>
        <div id="chatroom" style="display: none;">
          <h3>Chatroom</h3>
          <div id="messages" class="chat"></div>
          <input id="chatMessage" type="text" placeholder="Type a message..." />
          <button onclick="sendMessage()">Send</button>
          <button onclick="logout()">Logout</button>
        </div>
      </div>
      <script>
        let currentUser = null;

        function createAccount() {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const key = document.getElementById('key').value;

          fetch('/create-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, key })
          })
          .then(res => res.json())
          .then(data => alert(data.message));
        }

        function login() {
          const username = document.getElementById('loginUsername').value;
          const password = document.getElementById('loginPassword').value;

          fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              currentUser = data.user;
              document.getElementById('auth').style.display = 'none';
              document.getElementById('chatroom').style.display = 'block';
              loadMessages();
            } else {
              alert(data.message);
            }
          });
        }

        function sendMessage() {
          const message = document.getElementById('chatMessage').value;

          fetch('/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, message })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              document.getElementById('chatMessage').value = '';
              loadMessages();
            }
          });
        }

        function loadMessages() {
          fetch('/messages')
            .then(res => res.json())
            .then(data => {
              const messagesDiv = document.getElementById('messages');
              messagesDiv.innerHTML = data.messages.map(msg => 
                `<div class="message"><span>${msg.username}:</span> ${msg.message}</div>`
              ).join('');
            });
        }

        function logout() {
          currentUser = null;
          document.getElementById('auth').style.display = 'block';
          document.getElementById('chatroom').style.display = 'none';
        }
      </script>
    </body>
    </html>
  `);
});

// API to create an account
app.post('/create-account', (req, res) => {
  const { username, password, key } = req.body;

  if (users[username]) {
    return res.json({ success: false, message: 'Username already exists.' });
  }

  let role = 'User';
  for (const [roleName, roleKey] of Object.entries(ROLE_KEYS)) {
    if (key === roleKey) {
      role = roleName;
      break;
    }
  }

  users[username] = { password, role };
  res.json({ success: true, message: `Account created with role: ${role}` });
});

// API to login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!users[username] || users[username].password !== password) {
    return res.json({ success: false, message: 'Invalid username or password.' });
  }

  res.json({ success: true, user: { username, role: users[username].role } });
});

// API to send a message
app.post('/send-message', (req, res) => {
  const { username, message } = req.body;

  if (!username || !message) {
    return res.json({ success: false, message: 'Invalid message data.' });
  }

  messages.push({ username, message, timestamp: Date.now() });
  res.json({ success: true });
});

// API to get all messages
app.get('/messages', (req, res) => {
  res.json({ messages });
});

// Start the server
app.listen(port, () => {
  console.log(`Chatroom running at http://localhost:${port}`);
});
