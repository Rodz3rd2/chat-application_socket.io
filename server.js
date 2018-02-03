var express = require('express');
var app = express().use(express.static('node_modules'));

var http = require('http').Server(app);
var io = require('socket.io')(http);

var connected = {};

http.listen(8001, function () {
    console.log("Listening to *:8001");
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

io.on('connection', function (socket) {
    console.log("new client connected!");

    // register client and emit the total number of client
    socket.on('register-client', function (client_name) {
        connected[client_name] = socket.id;
        io.emit('connected', connected);
        socket.emit('show-username', client_name);
    });

    // send message to everyone
    socket.on('send-message-to-everyone', function (client_name, message) {
        io.emit('send-message', client_name, message);
    });

    // send message to everyone except the sender
    socket.on('send-message-to-everyone-except-me', function (client_name, message) {
        socket.broadcast.emit('send-message', client_name, message);
    });

    // send private message
    socket.on('send-private-message', function (sender, receiver, message) {
        if (receiver in connected) {
            io.sockets.sockets[connected[receiver]].emit('send-private-message', sender, message);
        } else {
            console.log("No socket detected for " + receiver);
        }
    });

    // client typing
    socket.on('on-typing-except-typer', function (client_name) {
        socket.broadcast.emit('on-typing', client_name);
    });

    // stop typing
    socket.on('stop-typing', function () {
        socket.broadcast.emit('stop-typing');
    });

    socket.on('disconnect', function () {
        console.log("client disconnected!");
        deleteConnectedBySocketId(socket.id);
        io.emit('connected-number', connected.length);
    });
});

function deleteConnectedBySocketId(socket_id) {
    for (var i in connected) {
        if (connected[i].socket_id === socket_id) {
            connected.splice(connected[i], 1);
            break;
        }
    }
}