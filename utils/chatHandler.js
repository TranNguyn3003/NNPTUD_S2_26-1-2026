let { Server } = require('socket.io')
let jwt = require('jsonwebtoken');
let userSchema = require('../schemas/users')
module.exports = {
    SocketServer: function (server) {
        const io = new Server(server);
        io.on('connection', async (socket) => {
            let token = socket.handshake.auth.token;
            let result = jwt.verify(token, 'HUTECH');
            if (result.exp > Date.now()) {
                let user = await userSchema.findOne({
                    _id: result.id
                })
                io.emit('welcome', user.username)
            }

        })
    }
}