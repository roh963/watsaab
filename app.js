//library , framwork , packages
import  express  from 'express';
import  dotenv  from 'dotenv';
import morgan from 'morgan';


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
   import loggingMiddleware from './src/middlewares/logging.middleware.js';
 // creating app
const app = express()

//logging
app.use(loggingMiddleware)

// midleware
app.use(cors());
app.use(morgan(dev));
app.use(express.json({limit:"16kb"}))


// routes setup
app.use('/api/chats', chatRoutes ) //chats routes 
app.use('/api/message',messageRoutes) //message routes
app.use('/api/users',userRoutes) // user routes

//using error handling 

app.use(errorHandler) // error handling

 export default app;