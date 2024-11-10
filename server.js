//library , framwork , packages
import express from 'express';
import dotenv from 'dotenv';

//fils
import app from './app';
import logger from './src/logger/winston.logger.js';
import { db } from './src/config/db.js';


// configration of dotenv
dotenv.config();


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