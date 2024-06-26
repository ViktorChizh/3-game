// для тестов надо закоментить стр.2,74,124 и раскоментить стр.3,231-233 Затем в package.json запустить test
export class Game {
// class Game {

    #settings = {
        pointsToWin: 10,
        gridSize: {
            columns: 4,
            rows: 4
        },
        googleJumpInterval: 2000
    }
    #status = 'pending'
    #player1
    #player2
    #google
    #googleSetIntervalId
    #score = {
        1: {points: 0},
        2: {points: 0}
    }

    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter
    }

    #getRandomPosition(coordinates) {
        let newX, newY;
        do {
            newX = NumberUtils.getRandomNumber(this.#settings.gridSize.columns);
            newY = NumberUtils.getRandomNumber(this.#settings.gridSize.rows);
        } while (coordinates.some(el => el.x === newX && el.y === newY));

        return new Position(newX, newY);
    }
    #createUnits() {
        const player1Position = this.#getRandomPosition([])
        this.#player1 = new Player(1, player1Position)

        const player2Position = this.#getRandomPosition([player1Position])
        this.#player2 = new Player(2, player2Position)

        this.#moveGoogleToRandomPosition(true)
    }

    async start() {
        if (this.#status === 'pending') {
            this.#createUnits()
            this.#status = 'in-process'
            this.#runGoogleJumpInterval()
        }

    }
    async stop() {
        clearInterval(this.#googleSetIntervalId)
        this.#status = 'stoped'
    }
    async #finish() {
        clearInterval(this.#googleSetIntervalId);
        this.#status = "finished";
    }

    #runGoogleJumpInterval() {
        this.#googleSetIntervalId = setInterval(() => {
            this.#moveGoogleToRandomPosition()
        }, this.#settings.googleJumpInterval)
    }
    #moveGoogleToRandomPosition(excludeGoogle) {
        let notCrossedPosition = [this.#player1.position, this.#player2.position]
        if (!excludeGoogle) {
            notCrossedPosition.push(this.#google.position)
        }
        this.#google = new Google(this.#getRandomPosition(notCrossedPosition))
      this.eventEmitter.emit('unitChangePosition')
    }

    #checkBorder(player, delta) {
        const newPosition = player.position.clone()
        if (delta.x) newPosition.x += delta.x
        if (delta.y) newPosition.y += delta.y

        if (delta.x) {
            return newPosition.x > this.#settings.gridSize.columns || newPosition.x < 1
        }
        if (delta.y) {
            return newPosition.y > this.#settings.gridSize.rows || newPosition.y < 1
        }
        return false;
    }
    #checkOtherPlayer(movingPlayer, otherPlayer, delta) {
        const newPosition = movingPlayer.position.clone()
        if (delta.x)  newPosition.x += delta.x;
        if (delta.y) newPosition.y += delta.y;

        return otherPlayer.position.equal(newPosition)
    }
    #checkGoogleCatching(player) {
        if (this.#google.position.equal(player.position)) {
            this.score[player.id].points++;
            if(this.score[player.id].points === this.#settings.pointsToWin){
                this.#finish()
                this.google.position = new Position(
                    this.#settings.gridSize.columns +1,
                    this.#settings.gridSize.rows +1
                )
            } else {
                clearInterval(this.#googleSetIntervalId)
                this.#moveGoogleToRandomPosition()
                this.#runGoogleJumpInterval()
            }
        }
    }

    #movePlayer(movingPlayer, otherPlayer, delta) {
        const isBorder = this.#checkBorder(movingPlayer, delta)
        const isOtherPlayer = this.#checkOtherPlayer(movingPlayer, otherPlayer, delta)
        if (isOtherPlayer || isBorder) {
            return
        }
        if (delta.x) {
            movingPlayer.position = new Position( movingPlayer.position.x + delta.x, movingPlayer.position.y)
        } else {
            movingPlayer.position = new Position( movingPlayer.position.x , movingPlayer.position.y+ delta.y)
        }
        this.#checkGoogleCatching(movingPlayer)
           this.eventEmitter.emit("unitChangePosition");
    }

    movePlayer1Right() {
        const delta = {x: 1}
        this.#movePlayer(this.#player1, this.#player2, delta)
    }
    movePlayer1Left() {
        const delta = {x: -1}
        this.#movePlayer(this.#player1, this.#player2, delta)
    }
    movePlayer1Up() {
        const delta = {y: -1}
        this.#movePlayer(this.#player1, this.#player2, delta)
    }
    movePlayer1Down() {
        const delta = {y: 1}
        this.#movePlayer(this.#player1, this.#player2, delta)
    }

    movePlayer2Right() {
        const delta = {x: 1}
        this.#movePlayer(this.#player2, this.#player1, delta)
    }
    movePlayer2Left() {
        const delta = {x: -1}
        this.#movePlayer(this.#player2, this.#player1, delta)
    }
    movePlayer2Up() {
        const delta = {y: -1}
        this.#movePlayer(this.#player2, this.#player1, delta)
    }
    movePlayer2Down() {
        const delta = {y: 1}
        this.#movePlayer(this.#player2, this.#player1, delta)
    }

    set settings(settings) {
        this.#settings = {...this.#settings, ...settings}
        // без проверки undefined может перезатереть начальные установки
        this.#settings.gridSize = settings.gridSize
            ? {...this.#settings.gridSize, ...settings.gridSize}
            : this.#settings.gridSize
    } // для тестов
    get settings() {
        return this.#settings
    } // для тестов

    get status() {
        return this.#status
    }

    get player1() {
        return this.#player1
    }
    get player2() {
        return this.#player2
    }
    get google() {
        return this.#google
    }

    get score() {
        return this.#score
    }
    set score(newScore) {
        this.#score = newScore;
    } // для тестов
}

class Position {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    clone() {
        return new Position(this.x, this.y)
    }

    equal(otherPosition) {
        return otherPosition.x === this.x && otherPosition.y === this.y
    }
}
class Unit {
    constructor(position) {
        this.position = position
    }
}
class Google extends Unit {
    constructor(position) {
        super(position)
    }
}
class Player extends Unit {
    constructor(id, position) {
        super(position)
        this.id = id
    }
}
class NumberUtils {
    static getRandomNumber(max) {
        return Math.floor(Math.random() * max + 1)
    }
}


// module.exports = {
//     Game,
// }