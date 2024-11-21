//library , framwork , packages
import mongoose from "mongoose";
import logger from './../logger/winston.logger.js'
import { MONGODB_URI } from "../../config.js";

//files 
const Db_Name = "watsaab"
export let dbInstance = undefined;
const db = async () => {
    try {
        const connetIns =await mongoose.connect(`${MONGODB_URI}/${Db_Name}`);
        dbInstance = connetIns;
        logger.info(`☘️  MongoDB Connected! Db host: ${connetIns.connection.host}`);
    } catch (error) {
        logger.error(`errror on database ${error}`)
        process.exit(1);
    }
}
export {db }

