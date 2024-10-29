import logger from './../logger/winston.logger';
import morgan from 'morgan';

morgan.token("status", (req, res) => res.statusCode)
morgan.token("url", (req) => req.url)
morgan.token("method", (req) => req.method)

const customFormat = ":method :url :status :response-time ms";

const loggingMiddleware = morgan(customFormat, 
    {
        stream: {
            write: (message) => {

                const status = parseInt(message.split(" ")[2], 10);
                if (status >= 400) {
                    logger.error(message.trim());
                } else {
                    logger.info(message.trim());
                }
            },
        },
    
})

export default loggingMiddleware;