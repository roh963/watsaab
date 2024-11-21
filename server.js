import dotenv from 'dotenv';
dotenv.config();
import http from "http";
import { Server as SocketServer } from "socket.io";
import express from 'express';
//fils
import app from './app.js';
import logger from './src/logger/winston.logger.js';
import { db } from './src/config/db.js';
import { initializSocketIO } from './src/socket/socketio.js'
import { PORT } from './config.js';


// configration of dotenv
//http server create 
const server = http.createServer(app)

//socket io intialize
const io = new SocketServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
//socketio initalize
initializSocketIO(io)
app.set("io", io);
// console.log(PORT)
const startserver = () => {
    app.listen(PORT, () =>
        logger.info(`📑 Visit the documentation at: http://localhost:${PORT} `)
    );
    logger.info("⚙️  Server is running on port: " + PORT);
}

try {
    await db();
    startserver();
} catch (err) {
    logger.error("Mongo db connect error: ", err);
}

