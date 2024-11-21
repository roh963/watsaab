import { ApiError } from '../utils/ApiError.js';
import logger from './../logger/winston.logger.js';
import { NODE_ENV } from './../../config.js';

const errorHandler = (err,req,res,next)=>{
       const statusCode = err  instanceof ApiError ? err.statusCode : 500;
       const message = err.message || "something wents wrong";

       logger.error(`[${req.method}]  ${req.url} - ${statusCode}: ${message}`);

       res.status(statusCode).json({
        success:false,
        statusCode,
        message,
        ...(NODE_ENV === "development" && {stack:err.stack})
       })
}
export default errorHandler
