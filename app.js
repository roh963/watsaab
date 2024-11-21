//library , framwork , packages
import  express  from 'express';
import morgan from 'morgan';
import helmet from "helmet"
import cors from "cors"

// external file 
  /*
    error handler middleware
    chat routes
    message routes 
    user routes 
  */
   import errorHandler  from './src/middlewares/errorHandler.middleware.js';
   import chatRoutes from "./src/routes/chat.routes.js"
   import messageRoutes from "./src/routes/message.routes.js"
   import userRoutes from "./src/routes/user.routes.js"
   import morganMiddleware from "./src/logger/morgan.logger.js"
   import  winston from 'winston';

 // creating app
const app = express()

//logging
app.use(morganMiddleware)
app.use(helmet({
  contentSecurityPolicy: false, // Disable Content-Security-Policy
}));

// midleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: winston.stream }));


// routes setup
app.use('/api/chats', chatRoutes ) //chats routes 
app.use('/api/message',messageRoutes) //message routes
app.use('/api/users',userRoutes) // user routes

//using error handling 

app.use(errorHandler) // error handling

 export default app;