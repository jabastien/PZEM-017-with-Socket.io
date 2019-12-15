var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('client connected');
    let channel = 'ESP';

    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
    });

    socket.on(channel, (msg) => {
        console.log('message:' + JSON.stringify(msg));
        //socket.emit("ESP", { "SW3" : 'state:on' });
        // Reply
        io.emit(channel, msg);
    });

    socket.on('command', (data) => {
        const { action, payload } = data;
        console.log('command:', [action, payload]);
        io.emit("ESP", { [action] : payload });
    });

});


http.listen(4000, () => {
    console.log('Server start on http://127.0.0.1:4000');
});