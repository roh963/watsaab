import winston from "winston";
import { NODE_ENV } from "../../config.js";

// quality of level 
const levels = {
    error:0,
    warn:1,
    info:2,
    http:3,
    debug:4
};

// logging level determine the logging based on  envv
const getloglevel = ()=>{
    const env = NODE_ENV || "development"; 
    return env === "development" ? "debug" : "warn";
}

// Colors for each quaility level
const colors = {
    error: "red",
    warn: "yellow",
    info: "blue",
    http: "magenta",
    debug: "white",
  };



  //link the color
  winston.addColors(colors);

//format coustomized

const format = winston.format.combine(
    winston.format.timestamp({ format: "DD MMM, YYYY - HH:mm:ss:ms" }), // Timestamp format define karte hain
    winston.format.colorize({ all: true }), // Colors ko apply karte hain
    winston.format.printf(({ timestamp, level, message }) => 
      `[${timestamp}] ${level}: ${message}` // Custom message format
    )
  );

  // transport
  const transports = [
    // Allow the use the console to print the messages
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/info.log", level: "info" }),
    new winston.transports.File({ filename: "logs/http.log", level: "http" }),
  ];
  // logger
  const logger = winston.createLogger({
    level: getloglevel(), // Logger ka level set karna
    levels,
    format,
    transports,
  });

  export default logger