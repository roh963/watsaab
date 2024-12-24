import morgan from "morgan"
import logger from "./winston.logger.js"
import { NODE_ENV } from "../../config.js";

const stream = {
    write :(message)=> logger.http(message.trim()),
};
const skip = ()=>{
    const env = NODE_ENV || "development"
    return env !== "development"
};
console.log(NODE_ENV)

const morganMiddleware = morgan(
    ":remote-addr :method :url :status - :response-time ms",
    {stream,skip}
)

export default morganMiddleware;
