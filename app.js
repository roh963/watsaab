//library , framwork , packages
import  express  from 'express';
import  dotenv  from 'dotenv';
import morgan from 'morgan';

// external file 
  /*
    error handler 
    chat routes
    message routes 
    user routes 
  */

 // creating app
const app = express()

// midleware
app.use(cors());
app.use(morgan(dev));
app.use(express.json({limit:"16kb"}))


// routes setup
app.use('/api/chats', ) //chats routes 
app.use('/api/message',) //message routes
app.use('/api/users',) // user routes

//using error handling 

app.use() // error handling

 export default app;