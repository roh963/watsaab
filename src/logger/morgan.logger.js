import morgan from "morgan"
import logger from "./winston.logger"

const stream = {
    write :(message)=> logger.http(message.trim()),
}
const skip = ()=>{
    const env = process.env.NODE_ENV
    return env !== "development"
};

const morganMiddleware = margan(
    ":remote-addr:method:url:status-:response-time ms",
    {stream,skip}
)
