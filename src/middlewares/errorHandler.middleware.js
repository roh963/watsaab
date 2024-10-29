import { ApiError } from '../utils/ApiError';
import logger from './../logger/winston.logger';
import { NODE_ENV } from './../../config';

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