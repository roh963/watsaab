# Explanation of server.js

# Express Server Setup with MongoDB Connection

This project sets up an Express server with environment variable management, logging, and a MongoDB database connection. Below is an explanation of the code components related to the server configuration.

## Server Code Explanation

```javascript
// Library, framework, and packages
import express from 'express'; // Web framework for Node.js
import dotenv from 'dotenv'; // Module for loading environment variables

// Files
import app from './app'; // Main application file
import logger from './src/logger/winston.logger'; // Logger utility
import { db } from './src/config/db'; // Database connection utility

// Configuration of dotenv
dotenv.config(); // Load environment variables from .env file

// Set the port for the server to listen on
const port = process.env.PORT || 5000;

// Function to start the server
const startserver = () => {
    app.listen(port, () =>
        logger.info(`📑 Visit the documentation at: http://localhost:${process.env.PORT || 8080}`)
    );
    logger.info("⚙️  Server is running on port: " + process.env.PORT);
}

// Try to connect to the database and start the server
try {
    await db(); // Attempt to connect to the MongoDB database
    startserver(); // Start the server if the database connection is successful
} catch (err) {
    logger.error("MongoDB connect error: ", err); // Log any connection errors
}
```

# App.js Explanation 

1. **Imports**:
   - `express`: This framework is used for building web applications.
   - `cors`: This middleware handles CORS headers.
   - `morgan`: This middleware is used for logging HTTP requests.
   - `errorHandler`: This middleware is used to handle errors.
   - `chatRoutes`, `messageRoutes`, `userRoutes`: These routes handle chat, message, and user-related requests.

2. **Express App**:
   - `const app = express();`: This line creates a new Express application.

3. **Middleware Setup**:
   - `app.use(cors())`: This enables CORS to allow requests from different origins.
   - `app.use(morgan('dev'))`: This logs requests in development mode.
   - `app.use(express.json())`: This parses incoming JSON requests.

4. **Route Setup**:
   - `app.use('/api/chats', chatRoutes)`: This sets up routes for chat-related requests.
   - `app.use('/api/messages', messageRoutes)`: This sets up routes for message-related requests.
   - `app.use('/api/users', userRoutes)`: This sets up routes for user-related requests.

5. **Error Handling Middleware**:
   - `app.use(errorHandler)`: This middleware handles errors.
6. **This all this we are setup soon**:



# Logger Utility with Winston

This project utilizes the **Winston** logging library to handle logging at different levels and formats. Below is an explanation of the code components related to the logger utility.

## Logger Code Explanation

```javascript
// Importing the Winston logging library
import winston from "winston";

// Quality levels for logging
const levels = {
    error: 0,   // Error messages
    warn: 1,    // Warning messages
    info: 2,    // Informational messages
    http: 3,    // HTTP request logs
    debug: 4,   // Debug messages
};

// Function to determine the logging level based on the environment
const getloglevel = () => {
    const env = process.env.NODE_ENV || "development"; // Get the current environment, default to development
    return env === "development" ? "debug" : "warn";   // Use 'debug' in development, 'warn' in production
};

// Colors for each logging level
const colors = {
    error: "red",       // Color for error messages
    warn: "yellow",     // Color for warning messages
    info: "blue",       // Color for informational messages
    http: "magenta",    // Color for HTTP logs
    debug: "white",     // Color for debug messages
};

// Link the defined colors to the corresponding logging levels
winston.addColors(colors);

// Customized log format
const format = winston.format.combine(
    winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:ss:ms" }), // Timestamp format definition
    winston.format.colorize({ all: true }), // Apply colors to the logs
    winston.format.printf(({ timestamp, level, message }) => 
      `[${timestamp}] ${level}: ${message}` // Custom format for log messages
    )
);

// Log transports - where the log messages will be sent
const transports = [
    new winston.transports.Console(), // Log messages to the console
    new winston.transports.File({ filename: "logs/error.log", level: "error" }), // Log error messages to a file
    new winston.transports.File({ filename: "logs/info.log", level: "info" }), // Log info messages to a file
    new winston.transports.File({ filename: "logs/http.log", level: "http" }), // Log HTTP messages to a file
];

// Create the logger instance
const logger = winston.createLogger({
    level: getloglevel(), // Set the logger level
    levels,
    format,
    transports,
});

// Export the logger for use in other parts of the application
export default logger;
```
# MongoDB Connection and Logger Utility

This project utilizes **Mongoose** for MongoDB connections and **Winston** for logging. Below is an explanation of the code components related to these functionalities.

## MongoDB Connection

The MongoDB connection is established using Mongoose, a popular Object Data Modeling (ODM) library for MongoDB and Node.js. The connection code is structured as follows:

### Code Explanation

```javascript
// Importing the required libraries and packages
import mongoose from "mongoose"; // Mongoose for MongoDB connection
import logger from './../logger/winston.logger'; // Logger utility for logging connection status

// Database name
const Db_Name = "watsaab"; // Name of the database to connect to

// Function to connect to the database
const db = async () => {
    try {
        // Connecting to MongoDB with the provided URI and options
        const connetIns = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: Db_Name, // Setting the database name
            useNewUrlParser: true, // Using the new URL parser
            useUnifiedTopology: true, // Enabling the unified topology layer
        });

        // Logging successful connection
        logger.info(`☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}`);
    } catch (error) {
        // Handle connection errors
        logger.error("MongoDB connection error: ", error); // Logging the error
    }
}
```