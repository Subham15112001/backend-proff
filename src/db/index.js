import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async ( ) => {
    try {
     const connectionInstance =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

      console.log(`port is connected ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`error : ${error}`);
        process.exit(1);
    }
}

export default connectDB;