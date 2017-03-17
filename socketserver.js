var app = require('express')(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

server.listen(process.env.PORT || 8088);

//Points express to a folder where static files are kept
app.use(require("express").static(__dirname + ""));

app.get('/', function(req, res) {
	res.sendfile(__dirname + '/index.html');
});

var playerQueue = [];

io.sockets.on('connection', function(socket) {
	socket.on('opponent-searching', function() {
		var oppID = playerQueue.shift();
		while (io.sockets.sockets[oppID] === undefined && playerQueue.length != 0)
			oppID = playerQueue.shift();
		if (io.sockets.sockets[oppID] === undefined || oppID === undefined) {
			playerQueue.push(socket.id);
			console.log(playerQueue);
		} else {
			console.log('Connecting ' + socket.id + ' with ' + oppID);
			io.sockets.socket(oppID).emit('opponent-found', {
				'oppID': socket.id,
				'clientID': oppID
			});
			io.sockets.socket(socket.id).emit('opponent-found', {
				'oppID': oppID,
				'clientID': socket.id
			});
		}
	});
	socket.on('client-disconnect', function(data) {
		io.sockets.socket(data.oppID).emit('opponent-disconnect');
	});
	socket.on('clientMousemove', function(data) {
		io.sockets.socket(data.oppID).emit('serverMousemove', data);
	});
	socket.on('fillCanvas', function(data) {
		io.sockets.socket(data.oppID).emit('fillCanvas', data);
	});
	socket.on('sendGuess', function(data) {
		io.sockets.socket(data.oppID).emit('receiveGuess', data);
	});
	socket.on('brushChange', function(data) {
		io.sockets.socket(data.oppID).emit('brushChange', data);
	});
	socket.on('startPaint', function(data) {
		io.sockets.socket(data.oppID).emit('startPaint', data);
	});
	socket.on('endPaint', function(data) {
		io.sockets.socket(data.oppID).emit('endPaint', data);
	});
});