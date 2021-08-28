class gameObj {
    constructor(x, y, width, height) {
        this._x = x
        this._y = y
        this._width = width
        this._height = height
    }
    drawOn(ctx) {
        throw new Error('You have to implement the method drawOn!');
    }
}

class colorObj extends gameObj {
    constructor(x, y, width, height, color) {
        super(x, y, width, height)
        this._color = color
    }

    drawOn(ctx) {
        ctx.fillStyle = this._color;
        ctx.fillRect(this._x, this._y, this._width, this._height);
    }
}


const c = document.getElementById("can")
const ctx = c.getContext("2d")
const o = new colorObj(100, 100, 25, 75, "#FF0000")
o.drawOn(ctx)