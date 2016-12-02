var http = require('http');
let express = require('express');
let socketio = require('socket.io');

let app = express();
let server = http.createServer(app);
let io = socketio(server);

let waitingPlayer;
let player1;
let player2;

io.on('connection', onConnection);

app.set('port', (process.env.PORT) || 4444);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/'));


server.listen(app.get('port'), () => {
	console.log('server started on port' + app.get('port') + "Listening Battleship..");
});


function onConnection(sock){
	sock.emit('msg', 'Hello!');
	sock.on('msg', (txt) => io.emit('msg', txt));

	if (waitingPlayer){
		// Match starts
		player1 = waitingPlayer;
		player2 = sock;
		notify(player1, player2);
		waitingPlayer = null;
		player2.emit('player', '2');

	} else {
		waitingPlayer = sock;
		sock.emit('msg', 'You are waiting for a second player');
		sock.emit('player', '1');
	}

	  sock.on('moveToServer', incomingMove);
	  sock.on('ready', boardConfig);

	  function incomingMove(mover){
		// console.log('moving :', mover, player1 === player2, typeof mover);
		mover[0] === '1' ? player2.emit('moveToClient', mover) : player1.emit('moveToClient', mover);
		}
		function boardConfig(board){
			board[0] === '1' ? player2.emit('opponentReady', board[1]) : player1.emit('opponentReady', board[1]);
		}
}

function notify(sock1, sock2){
	sock1.emit('msg', 'you are player 1');
	sock2.emit('msg', 'you are player 2');
	[sock1, sock2].forEach((sock) => sock.emit('msg', 'Match starts. Place your ships	'));
}
