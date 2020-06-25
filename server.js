const { MongoClient } = require('mongodb');

// Entry file
const mongo = require('mongodb').MongoClient;
const socket = require('socket.io').listen(4000).sockets;

// Connect to MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'mongochat';
const client = new MongoClient(url);
client.connect(function(err) {
    if (err) {
        throw err;
    }
    const db = client.db(dbName);
    console.log("Connected successfully to server...");

    // Connect to socket.io
    socket.on('connection', function(socket) {
        let chat = db.collection('chats');

        //Create function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        // Get chats from collection
        chat.find().limit(100).sort({_id: 1}).toArray(function (err, result) {
            if(err){
                throw err
            }
            // Emit the messages
            socket.emit('output', result);
        });

        // Handle input
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            if (name == '' || message == '') {
                // Send error status
                sendStatus('Please enter name and message');
            } else {
                chat.insert({name: name, message: message}, function(){
                    socket.emit('output', [data]);
                    
                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });

            }
        });

        // Handle clear
        socket.on('clear', function(data) {
            // Remove all chats from collection
            chat.remove({}, function() {
                // Emit clear
                socket.emit('cleared');
            });

        });
    });

    client.close();

});