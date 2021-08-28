const FPS = 120 / 60
const fs = require('fs')
class GameObj {
    constructor(x, y, width, height) {
        this._x = x
        this._y = y
        this._width = width
        this._height = height
    }

    distanceToPoint(x, y) {
        return Math.sqrt(Math.pow(this._x - x, 2) + Math.pow(this._y - y, 2))
    }

    distanceTo(obj) {
        return this.distanceToPoint(obj._x, obj._y)
    }

    isCollision(obj, recursion=false) {
        if (!recursion)
            if(obj.isCollision(this, true))
                return true
        const top = Math.floor((obj._y - obj._height / 2))
        const bot = Math.floor((obj._y + obj._height / 2))
        const left = Math.floor((obj._x - obj._width / 2))
        const right = Math.floor((obj._x + obj._width / 2))
        const top2 = Math.floor((this._y - this._height / 2))
        const bot2 = Math.floor((this._y + this._height / 2))
        const left2 = Math.floor((this._x - this._width / 2))
        const right2 = Math.floor((this._x + this._width / 2))
        if (top <= bot2 && top >= top2) {
            return (left <= right2 && left >= left2) || (right <= right2 && right >= left2)
        }

        if (bot <= bot2 && bot >= top2) {
            return (left <= right2 && left >= left2) || (right <= right2 && right >= left2)
        }
        return false
    }
    
    angleTo(obj) {
        return this.angleToPoint(obj._x, obj._y)
    }

    angleToPoint(x, y) {
        const add = x < this._x ? Math.PI : 0
        return (Math.atan((y - this._y) / (x - this._x)) + add) 
    }

    update() {
    }
}
GameObj.objects = []

class ColorObj extends GameObj {
    constructor(x, y, width, height, color) {
        super(x, y, width, height)
        this._color = color
    }
}

class Player extends ColorObj {
    constructor(x, y, width, height, color, speed, id, map, target, maxHealth=10) {
        super(x, y, width, height, color)
        this._id = id
        this._speed = speed /FPS
        this.keys = {
            'up': false,
            'right': false,
            'down': false,
            'left': false,
            'mouse': false
        }
        this._map = map
        this.alive = true
        this._target = target
        this.weapon = new Gun()
        this._maxHealth = maxHealth
        this.health = maxHealth
        this.angle = 0
        this.name = ''
        this.defaultWeapon = Gun
        this.hasTracker = false
        this.trackerTime = 0
        Player.players[id] = this
    }
    updateMovement() {
        const oldX = this._x
        const oldY = this._y
        if (this.keys['up'])
            this._y -= this._speed
        if (this.keys['right'])
            this._x += this._speed
        if (this.keys['down'])
            this._y += this._speed
        if (this.keys['left'])
            this._x -= this._speed
        if (this._map.isCollision(this)) {
            //console.log('collide')
            const newX = this._x 

            this._x = oldX
            if (!this._map.isCollision(this))
                return

            this._y = oldY
            this._x = newX
            if (!this._map.isCollision(this))
                return
            
            this._x = oldX
        }
    }
    attack() {
        if (!(this.alive))
            return
        //if (!this._target.active)
         //   return
        //console.log('attack in player')
        this.weapon.attack(this, Player.players[this._target.getTarget(this._id)], this.angle)
        /*for (let i in Player.players) {
            if (this === Player.players[i])
                continue
            if (!(Player.players[i].alive))
                continue
            if (this.distanceTo(Player.players[i]) <= this._range)
                Player.players[i].die()
        }*/
    }

    die() {
        console.log('player die')
        this._target.kill(this._id)
        this.alive = false
        this._color = 'black'
    }

    revive() {
        this.alive = true
        this._color = randomColor()
        this.health =  this._maxHealth
        this.weapon = new this.defaultWeapon()
        this.hasTracker = false
        this.trackerTime = 0
    }

    heal(healthNum) {
        if (this.alive && this.health < this._maxHealth) {
            this.health = Math.min(this._maxHealth, this.health + healthNum)
            return true
        }
        return false
    }

    update() {
        super.update()
        this.updateMovement()

        if (this.alive) {
            this.checkCollectableObj()
            if (this.keys['mouse']) {
                this.attack()
            }
        }

        if (new Date().getTime() >= this.trackerTime)
            this.disableTracker()
    }

    checkCollectableObj() {
        for (let c in CollectableObj.objects) {
            if (this.isCollision(CollectableObj.objects[c])) {
                CollectableObj.objects[c].collide(this)
            }
        }
    }

    damage(d) {
        this.health -= d
        if (this.health <= 0) {
            this.die()
            this.health = 0
        }
    }

    getTargetName() {
        if(!this._target.active)
            return ''
        return Player.players[this._target.getTarget(this._id)].name
    }

    changeWeapon(weapon) {
        this.weapon = weapon
    }

    getTargetPlayer() {
        return Player.players[this._target.getTarget(this._id)]
    }

    enableTracker(time) {
        this.hasTracker = true
        this.trackerTime = new Date().getTime() +  time
    }

    disableTracker() {
        this.hasTracker = false
    }

    getTracker() {
        if(!this._target.active || !this.hasTracker)
            return {valid: false, angle: 0}
        const a = this.angleTo(this.getTargetPlayer())
        return {valid: true, angle: a}
        
    }
}

class AI extends Player {
    constructor(x, y, width, height, color, speed, map, target, name) {
        super(x, y, width, height, color, speed, Math.random(), map, target)
        this.count = 0
        this.num = 250 
        target.addPlayer(this._id)
        this.name = name
    }
    update() {
        super.update()
        this.count++
        const t = this.getTargetPlayer()
        let find = false
        if (t) {
            if (this.distanceTo(t) <= 480) {
                if (this.alive) {
                    this.angle = this.angleTo(t)
                    const up =  this._y + 100 > t._y ? true : false
                    const left =  this._x + 100 > t._x ? true : false
                    this.keys = {
                        'up': up,
                        'right': !left,
                        'down': !up,
                        'left': left,
                        'mouse': true
                    }
                    this.count = this.num
                    find = true
                }
            }
        }
        if (!find) {
            if (this.count > this.num) {
                const up =  Math.random() > 0.5 ? true : false
                const left =  Math.random() > 0.5 ? true : false
                this.keys = {
                    'up': up,
                    'right': !left,
                    'down': !up,
                    'left': left,
                    'mouse': true
                }
                this.angle = Math.random() * 2 * Math.PI
                this.count = 0
            }
        }
    }
}

function randomColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16)
}

function csvToArray(path, map) {
    console.log('reading from file')
    fs.readFile(path, 'utf8', function (err,data) {
        if (err) {
            return console.log(err)
        }
        const arr = data.split("\n")
        arr.pop()
        const final = []
        for (let i = 0; i < arr.length; i++) {
            final.push(arr[i].split(','))
        }
        map.setGrid(final)
    })
}

class Map {
    constructor(csv, tileSize) {
        this.active = false
        this.grid = csvToArray(csv, this)
        this._tileSize = tileSize
    }

    setGrid(arr) {
        console.log('finish reading from file')
        this.grid = arr.slice()
        this.active = true
        console.log(this.grid)
    }

    isCollision(obj) {
        if (this.active === false)
            return true
        const top = Math.floor((obj._y - obj._height / 4) / this._tileSize)
        const bot = Math.floor((obj._y + obj._height / 4) / this._tileSize)
        const left = Math.floor((obj._x - obj._width / 4) / this._tileSize)
        const right = Math.floor((obj._x + obj._width / 4) / this._tileSize)
        //console.log('top: {0} bot: {1} left: {2} right {3}', top, bot, left, right)
        //console.log(this.grid[top][left], ' ', this.grid[top][right], ' ', this.grid[bot][left], ' ', this.grid[bot][right])
        let flag = true
        try {
           flag = !(this.grid[top][left] == 0 && this.grid[top][right] == 0 && this.grid[bot][left] == 0 && this.grid[bot][right] == 0)  
        } finally {
            return flag
        }
    }

    getRandomPosition() {
        const pos = {x: 0, y: 0}
        while (this.grid[pos.y][pos.x] != 0) {
            pos.x = Math.floor(Math.random() * (this.grid.length-2)) +1
            pos.y = Math.floor(Math.random() * (this.grid[0].length-2)) +1
        }
        pos.x = pos.x * this._tileSize + this._tileSize / 2 
        pos.y = pos.y * this._tileSize + this._tileSize / 2
        return pos
    }
}

class TargetCycle {
    constructor() {
        this.players = []
        this.cycle = []
        this.active = false
    }

    addPlayer(id) {
        this.players.push(id)
    }

    removePlayer(id) {
        this.kill(id)
        this.players.splice(this.players.indexOf(id), 1)
    }

    generateCycle() {
        this.cycle = []
        const list = [...this.players]
        while (list.length > 0) {
            const ind = Math.floor(Math.random() * list.length)
            this.cycle.push(list[ind])
            list.splice(ind, 1)
        }
        this.active = true
    }

    getTarget(id) {
        return this.cycle[(this.cycle.indexOf(id) + 1) % this.cycle.length]
    }

    getKiller(id) {
        return this.cycle[(this.cycle.indexOf(id) - 1 + this.cycle.length) % this.cycle.length]
    }
    
    kill(id) {
        this.cycle.splice(this.cycle.indexOf(id), 1)
        if (this.cycle.length <= 1)
            this.active = false
    }

}

class Weapon {
    constructor() {

    }

    attack(owner, target, angle) {}
}

class Knife extends Weapon {
    constructor(range=50) {
        super()
        this._range = range
    }

    attack(owner, target, angle) {
        console.log('attack in knife', owner.distanceTo(target), this._range)
        if (owner.distanceTo(target) <= this._range) {
            target.damage(target.health)
            console.log('kill in knife')
        }
    }
}

class Gun extends Weapon {
    constructor(bullet=Bullet, speed=500) {
        super()
        this._bullet = bullet
        this._speed = speed
        this.canShoot = true
    }
    attack(owner, target, angle) {
        if (this.canShoot) {
            this.shoot(owner, target, angle)
            this.canShoot = false
            setTimeout(() => {this.canShoot = true}, this._speed)
        }
    }
    shoot(owner, target, angle) {
        new this._bullet(owner._x, owner._y, 12, angle + (Math.random() - 0.5) * 0.25, owner, target)
    }
}

class Shotgun extends Gun {
    constructor() {
        super(Bullet, 700)
    }
    shoot(owner, target, angle) {
        new this._bullet(owner._x, owner._y, 12, angle + 0.25 + (Math.random() - 0.5) * 0.25, owner, target, 2, true, 50)
        new this._bullet(owner._x, owner._y, 12, angle + (Math.random() - 0.5) * 0.25, owner, target, 2, true, 50)
        new this._bullet(owner._x, owner._y, 12, angle - 0.25 + (Math.random() - 0.5) * 0.25, owner, target, 2, true, 50)
    }
}

class Sniper extends Gun {
    constructor() {
        super(SniperBullet, 1000)
    }
    shoot(owner, target, angle) {
        new this._bullet(owner._x, owner._y, angle, owner, target)
    }
}

class Bullet extends ColorObj {
    constructor(x, y, speed, angle, owner, target, damage=2, stop=false, stopCount=0) {
        super(x, y, 5, 5, 'black')
        this.dx = speed * Math.cos(angle) / FPS
        this.dy = speed * Math.sin(angle)/ FPS
        this._target = target
        this._owner = owner
        this._damage = damage
        this._stop= stop
        this._stopCount =stopCount
        this.count = 0
        this.id = Math.random()
        GameObj.objects[this.id] = this
    }
    update() {
        super.update()
        this.updateMovement()
        this.checkCollision()
        this.count++
        if (this._stop) {
            if(this.count > this._stopCount) {
                delete GameObj.objects[this.id]
            }
        }
    }

    updateMovement() {
        this._x += this.dx
        this._y += this.dy
    }

    checkCollision() {
        if (this._owner._map.isCollision(this)) {
            delete GameObj.objects[this.id]
            return
        }
        for (let p in Player.players) {
            if(p == this._owner._id || !Player.players[p].alive)
                continue
            if(this.isCollision(Player.players[p])) {
                if(this._target) {
                    if (p == this._target._id)
                        this._target.damage(this._damage)
                    else if (p == this._owner._target.getKiller(this._owner._id))
                        Player.players[p].damage(this._damage)
                    else
                        this._owner.damage(this._damage)
                }
                delete GameObj.objects[this.id]
                break
            }
        }
    }
}

class SniperBullet extends Bullet {
    constructor(x, y, angle, owner, target) {
        super(x, y, 20, angle, owner, target, 5)
    }
}

class CollectableObj extends ColorObj {
    constructor (x, y, width, height, color) {
        super(x, y, width, height, color)
        this.id = Math.random()
        CollectableObj.objects[this.id] = this
        GameObj.objects[this.id] = this

    }
    destroy() {
        delete CollectableObj.objects[this.id]
        delete GameObj.objects[this.id]
    }
    collide(obj) {}
}

CollectableObj.checkPos = function(x, y) {
    for (let i in  CollectableObj.objects) {
        if (CollectableObj.objects[i]._x == x && CollectableObj.objects[i]._y == y)
            return true
    }
    return false
}

CollectableObj.randomPos = function(map, collectClass, num) {
    for (var i = 0; i < num; i++) {
        let pos = map.getRandomPosition()
        while (CollectableObj.checkPos(pos.x, pos.y))
            pos = map.getRandomPosition()
        new collectClass(pos.x, pos.y) 
    }
}

class Medkit extends CollectableObj {
    constructor (x, y) {
        super(x, y, 15, 15, 'green')
        this.healthNum = 2
    }

    collide(obj) {
        if (obj.heal) {
            if (obj.heal(this.healthNum))
                this.destroy()
        }
    }
}

class CollectWeapon extends CollectableObj {
    constructor(x, y, color, weapon) {
        super(x, y, 15, 15, color)
        this._weapon = weapon
    }
    collide(obj) {
        if (obj.changeWeapon) {
            this.destroy()
            obj.changeWeapon(new this._weapon())
            
        }
    }
}

class CollectShotGun extends CollectWeapon {
    constructor(x, y) {
        super(x, y, 'white', Shotgun)
    }
}

class CollectSniper extends CollectWeapon {
    constructor(x, y) {
        super(x, y, 'blue', Sniper)
    }
}

class CollectTracker extends CollectableObj {
    constructor(x, y) {
        super(x, y , 15, 15, 'red')
        this.time = 3500
    }

    collide(obj) {
        if (obj.enableTracker) {
            obj.enableTracker(this.time)
            this.destroy()
        }
    }
}

CollectableObj.objects = []

Player.players = {}

module.exports.GameObj = GameObj
module.exports.ColorObj = ColorObj
module.exports.Player = Player
module.exports.Map = Map
module.exports.TargetCycle = TargetCycle
module.exports.randomColor = randomColor
module.exports.CollectableObj = CollectableObj
module.exports.Medkit = Medkit
module.exports.CollectShotGun = CollectShotGun
module.exports.CollectSniper = CollectSniper
module.exports.CollectTracker = CollectTracker
module.exports.AI = AI

