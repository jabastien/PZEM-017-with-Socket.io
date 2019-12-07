var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

var light = { state: false };

io.on('connection', (socket) => {
    console.log('client connected');
    let channel = 'ESP';

    //socket.emit('light', light);

    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
    });

    // Listen
    socket.on(channel, (msg) => {
        console.log('message:' + JSON.stringify(msg));
        //socket.emit('response', "Hi ESP");

        //socket.emit("ESP", { "SW3" : 'state:on' });
        // Reply
        //io.emit(channel, msg);
    });

    //socket.emit("ESP", { "SW1" : 'state:on' });

    // io.sockets.emit('led', light);
    // socket.on('toggle', function (state) {
    //     light.state = !light.state;
    //     console.log('id: ' + client.id + 'light: ' + light.state);
    //     io.sockets.emit('led', light);
    // });

});


http.listen(4000, () => {
    console.log('Server start on http://127.0.0.1:4000');
});