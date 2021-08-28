const express = require('express')
const app = express()
const serv = require('http').Server(app)
const go = require('./server/gameObj.js')

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Cross-Origin-Resource-Policy', 'cross-origin')
    res.header('Cross-Origin-Embedder-Policy', 'require-corp')
    next();
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Cross-Origin-Resource-Policy', 'cross-origin')
    res.header('Cross-Origin-Embedder-Policy', 'require-corp')
    next();
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html')
})

app.use('/client', express.static(__dirname + '/client'))

serv.listen(process.env.PORT || 3000)
console.log('Server started')

const io = require('socket.io')(serv, {})

const SOCKET_List = {}
const map = new go.Map('./server/map.csv', 48)
const cycle = new go.TargetCycle()
new go.AI(200, 200, 20, 50, 'red', 3, map, cycle, 'bot')
new go.AI(200, 200, 20, 50, 'red', 3, map, cycle, 'oron')
new go.AI(200, 200, 20, 50, 'red', 3, map, cycle, 'pro')
io.sockets.on('connection', function(socket) {
    console.log('Socket conntion')

    socket.id = Math.random()
    SOCKET_List[socket.id] = socket
    new go.Player(200, 200, 20, 50, 'red', 3,  socket.id, map, cycle)
    cycle.addPlayer(socket.id)

    socket.on('keyPress', function (data) {
        go.Player.players[socket.id].keys[data.input] = data.state
    })

    socket.on('attack', function (data) {
        go.Player.players[socket.id].angle = data.angle
    })
    
    socket.on('start', function(data) {
        if (data == 'amir11') {
            console.log('start game')
            for (let i in go.Player.players) {
                go.Player.players[i].revive()
                const pos = map.getRandomPosition()
                go.Player.players[i]._x = pos.x
                go.Player.players[i]._y = pos.y
            }
            cycle.generateCycle()
            go.GameObj.objects = []
            go.CollectableObj.objects = []
            go.CollectableObj.randomPos(map, go.Medkit, 15)
            go.CollectableObj.randomPos(map, go.CollectShotGun, 5)
            go.CollectableObj.randomPos(map, go.CollectSniper, 5)
            go.CollectableObj.randomPos(map, go.CollectTracker, 10)
        } else {
            socket.emit('fuck')
        }
    })

    socket.on('setName', function(data) {
        go.Player.players[socket.id].name = data
    })

    socket.on('disconnect', function() {
        delete SOCKET_List[socket.id]
        delete go.Player.players[socket.id]
        cycle.removePlayer(socket.id)
    })
})
const FPS = 120
setInterval(function () {
    const pack = []
    let alive = 0
    for (o in go.Player.players) {
        const obj = go.Player.players[o]
        obj.update()
        pack.push({
            x: obj._x,
            y: obj._y,
            width: obj._width,
            height: obj._height,
            color: obj._color,
            health: obj.health/obj._maxHealth,
            name: obj.name
        })
        if (obj.alive)
            alive++
    }
    for (o in go.GameObj.objects) {
        const obj = go.GameObj.objects[o]
        obj.update()
        pack.push({
            x: obj._x,
            y: obj._y,
            width: obj._width,
            height: obj._height,
            color: obj._color
        })
    }

    for (s in SOCKET_List) {
        SOCKET_List[s].emit('update', {
            pack: pack,
            x: go.Player.players[SOCKET_List[s].id]._x,
            y: go.Player.players[SOCKET_List[s].id]._y,
            target: {
                color: (go.Player.players[cycle.getTarget(SOCKET_List[s].id)] || {_color: 'white'})._color,
                name: go.Player.players[SOCKET_List[s].id].getTargetName()
            },
            tracker: go.Player.players[SOCKET_List[s].id].getTracker(),
            alive: alive,
            total: Object.keys(go.Player.players).length
            //time: new Date().getTime()
        })
    }
}, 1000/FPS)