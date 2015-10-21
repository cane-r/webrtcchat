var port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"
var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
    //res.setHeader('Access-Control-Allow-Origin', '85.96.198.184');
    //res.setHeader('Access-Control-Allow-Methods', 'GET');
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    file.serve(req, res);
}).listen(port,ip);
//listen(port,ip);
//listen(2013,"127.0.0.1");


// var express = require('express');
// var app = express();
// console.log(express.static(__dirname + '/js'));
// app.use(express.static(__dirname + '/js'));
// app.all('*', function(req, res){
//  res.sendfile("index.html");
// });

// app.listen(9000);

var rooms=populate();

function populate(){
    var i=0;
    var rooms=[];
    for(;i<=300;i++){
        rooms[i]=""+i;
    }
    return rooms;

}

function printRooms(){
    for(var i=0;i<rooms.length;i++)
        console.log(rooms[i]);
}


var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket){

//printRooms();

    socket.on("search", function (data) {
        console.log('On search event..');
        for(var i=0;i<rooms.length;i++){
            var room=rooms[i];
            var size = io.sockets.clients(room).length;
            console.log("On search event..Room " + room + " has " + size + " clients" );
                   if(size<2){
                    socket.emit("found",room);
                    break;
                    
                   
               }
        }

    });

    socket.on('message', function (message,room) {
        console.log('Got message: ' + message + " room is : " + room);
        //here another parameter is needed,ie room..
        //io.sockets.in(room).emit('message',message);
        socket.broadcast.to(room).emit('message',message);
    });

    socket.on('sendM', function (message,room) {
        
        if(/\S/.test(message)){
           console.log("Sending text message..");
        socket.broadcast.to(room).emit("mesreceived",message);
    }
    });


    socket.on('init', function (room) {
        console.log("Init called..");
            socket.broadcast.to(room).emit("change", true);
        
    });

    socket.on('leaved', function (room) {
        console.log("Leaving room : " + room + " which has " + io.sockets.clients(room).length + "clients" );
           socket.leave(room);
           console.log("Leaved room : " + room + " which has " + io.sockets.clients(room).length + "clients" );

        
    });

    socket.on('create or join', function (room) {
        var numClients = io.sockets.clients(room).length;

        console.log('Room ' + room + ' has ' + numClients + ' client(s)');
        console.log('Request to create or join room', room);

        if (numClients == 0){
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room);
        } else { // max two clients
            socket.emit('full', room);
        }
        socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
        socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

    });

});

