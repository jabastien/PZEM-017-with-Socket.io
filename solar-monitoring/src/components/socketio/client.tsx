import io from 'socket.io-client';
import { AppConfig } from '../../constants/Constants'
const socket = io(AppConfig.socket_io_url, {
    //forceNew: true,
    secure: true,
    //reconnect: true,
    rejectUnauthorized: false
});
const channel = 'ESP';

socket.on('connect', () => {
    socket.emit('room', channel);
    console.log('send emit to socket.io', socket.id);
});

socket.on('disconnect', (reason: any) => {
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

const subscribeData = (cbSubscribe: any) => {
    socket.on(channel, (data: any) => {
        cbSubscribe(data);
    })
}
//Send data to socket.io server
const broadcastData = (action: string, payload: any) => {
    console.log(['broadcastToClient', action, payload]);
    socket.emit('command', {
        action: action,
        payload: payload
    });
}

const unsubscribe = () => {
    socket.emit('leave-room', 'stock-room');
    socket.off('updated');
}

export {
    subscribeData,
    broadcastData,
    unsubscribe
};