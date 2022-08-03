var jsforce = require('jsforce');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
var config = require('./config.js');
var channel = '/data/CaseChangeEvent';
var user = config.USERNAME;
var pass = config.PASSWORD;
var securityToken = config.SECURITYTOKEN;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
});

var replayId = -1; // -1 = Only New messages | -2 = All Window and New
var conn = new jsforce.Connection();
conn.login(user, pass + securityToken, function (err, res) {
  console.log('loggedin');
  if (err) {
    return console.error(err);
  }

  var client = conn.streaming.createClient([
    new jsforce.StreamingExtension.Replay(channel, replayId),
    new jsforce.StreamingExtension.AuthFailure(function () {
      console.log('failed');
      return process.exit(1);
    }),
  ]);

  subscription = client.subscribe(channel, function (data) {
    console.log('Received CDC Event');
    console.log(JSON.stringify(data));
    console.log('************ STATUS ***************');
    console.log(JSON.stringify(data.payload.Status));
    //socket.send(JSON.stringify(data));
    console.log('Data sent to clients!!');
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});