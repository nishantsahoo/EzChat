var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');

users = {};
connections = [];

server.listen(process.env.PORT || 3000);
console.log('Server Running....');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', function (req,res) {
	res.sendFile(__dirname + '/index.html');
});

/**
 * @param user (user object with id, email, name, etc.)
 * @param message (string)
 *
 */
app.post('/api/deliver', function (req, res) {
	
	//console.log("this is the goddam user "+req.body['user']);
	console.log('body here -->');
	//console.log( req.body);

	console.log('current user is : --> ')
	console.log( req.body['currentUser[_doc][fullname]'])
	//console.log(req.body['user[email]']);
	console.log(users[req.body['user[email]']]);
	if (req.body['user[email]'] in users) {
		users[req.body['user[email]']].emit('notification', {message: req.body['message[body]'], user:req.body['user[fullname]'],currentUser: req.body['currentUser[_doc][fullname]'], currentUserEmail: req.body['currentUser[_doc][email]'], currentUserNumber: req.body['currentUser[_doc][phnumber]']});
		return res.status(200).send();
	}
	return res.status(500).send({'message': 'User not found'});
});

io.sockets.on('connection', function (socket) {

	socket.on('new user', function (data, callback) {
		if(data in users) {
			callback(false);
		}
		else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket
			
			updateNicknames();
			
		}
	});

function updateNicknames() {
		io.sockets.emit('usernames', Object.keys(users));
}

	socket.on('send message', function (data, callback) {
		var msg = data.trim();
		if(msg.substr(0,3) == '/w '){
			msg = msg.substr(3)
			var ind = msg.indexOf(' ')
				if(ind != -1){
					var name = msg.substr(0, ind)
					var msg = msg.substr(ind+1)
					if(name in users){
						users[name].emit('whisper',{msg: data, nick: socket.nickname})

						console.log('whisper')
					}
					else{
						callback('Error. Enter valid user')
					}
				}
				else{
					callback('Error. Enter message')
				}
		}
		else{
		io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
		}
	});

	socket.on('disconnect', function (data) {
		if(!socket.nickname)
			return;
		delete users[socket.nickname]
		updateNicknames();
	});
}); // main function

   
	























