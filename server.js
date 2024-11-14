//library , framwork , packages
import express from 'express';
import dotenv from 'dotenv';
import http from "http";
import { Server as SocketServer } from "socket.io";
//fils
import app from './app.js';
import logger from './src/logger/winston.logger.js';
import { db } from './src/config/db.js';
import { initializeSocketIO } from './src/socket/socketio.js';


//http server create 
const server = http.createServer(app)
// configration of dotenv
dotenv.config();

//socket io intialize
const io = new SocketServer(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
})
//socketio initalize
initializeSocketIO(io)

app.set("io",io);
const port = process.env.PORT || 5000;
const startserver = () => {
    app.listen(port, () =>
        logger.info(`📑 Visit the documentation at: http://localhost:${process.env.PORT || 8080} `)
    );
    logger.info("⚙️  Server is running on port: " + process.env.PORT);
}

try {
    await db();
    startserver();
} catch (err) {
    logger.error("Mongo db connect error: ", err);
}





app.listen(port, () => `Server running on port ${port} 🔥`);