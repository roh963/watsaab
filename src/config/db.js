//library , framwork , packages
import mongoose from "mongoose";
import logger from './../logger/winston.logger';

//files 
const Db_Name = "watsaab"

const db = async () => {
    try {
        const connetIns = await mongoose.connect(process.env.MONGODB_URI,{
            dbName:Db_Name,
            useNewUrlParser: true, 
            useUnifiedTopology: true,
        });
        logger.info(`☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}`);

    } catch (error) {

    }
}
export {db }