var port = process.env.OPENSHIFT_NODEJS_PORT || 8443 || 8080;
//var port=8443 ;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var static = require('node-static');
//var http = require('https');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    file.serve(req, res);

});
/*
http.get("*",function(req,res){  
    if(req.url.indexOf("https")===-1){
//!(req.secure) || 
        res.redirect("https://webrtcchat-redhatappv2.rhcloud.com");
    }
  
});
*/

app.listen(port,ip);


//listen(port,ip);
//listen(2013,"127.0.0.1");


var rooms=populate();
var clients=[];

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

console.log("Socket id : " + socket.id);
clients[socket.id]=socket;
    socket.on("search", function (data) {
        console.log('On search event..');
        for(var i=0;i<rooms.length;i++){
            var room=rooms[i];
            var size = io.sockets.clients(room).length;
            console.log("On search event..Room " + room + " has " + size + " clients" );
                   if(size<2){
                    break;
                    } 
        }
        socket.emit("found",room);
        //setTimeout(function(){ socket.emit("found",room);},200);

    });

    socket.on('message', function (message,room) {
        console.log('Got message: ' + message + " room is : " + room);
        //here another parameter is needed,ie room..
        //io.sockets.in(room).emit('message',message);
        socket.broadcast.to(room).emit('message',message);
        clients[socket]
    });




    socket.on('init', function (dd,room) {
        console.log("Init called..");
            socket.broadcast.to(room).emit("change", dd);
            //socket.emit("change", true);
        
    });

    socket.on('leaved', function (room) {
        console.log("Leaving room : " + room + " which has " + io.sockets.clients(room).length + "clients" );
           socket.leave(room);
           console.log("Leaved room : " + room + " which has " + io.sockets.clients(room).length + "clients" );

        
    });

    socket.on('create or join', function (room) {
        var numClients = io.sockets.clients(room).length;

        console.log('Room ' + room + ' has ' + numClients + ' client(s)');
       

        if (numClients == 0){
            socket.join(room);
            console.log('Created  room ' + room);
            console.log("Room " + room + " has " + numClients + " clients" );
            socket.emit('created', room);
            numClients = io.sockets.clients(room).length;
            console.log("Room " + room + " has " + numClients + " clients" );
        } else if (numClients == 1) {
            //io.sockets.in(room).emit('join', room);
            //setTimeout(function(){socket.broadcast.to(room).emit('join',room);},1000);
            socket.join(room);
            socket.broadcast.to(room).emit('join',room);
            
            console.log('Joined room ' + room);
            numClients = io.sockets.clients(room).length;
            console.log("Room " + room + " has " + numClients + " clients" );
            socket.emit('joined', room);
        } else { // max two clients
            socket.emit('full', room);
        }
        socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
        socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

    });

});

