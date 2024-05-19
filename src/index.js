import connectDB from "./db/index.js";
import dotenv from 'dotenv';



dotenv.config({
    path: './env'
})

connectDB();


//type 1 not good as pollute the file
// const app = express();
// const port = process.env.PORT || 8000;

// (async () => {
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//        app.on("error",(error)=>{
//         console.log("error : ",error);
//        })

//        app.listen(port,()=>{
//         console.log("listening on port :",port)
//        })

//     } catch (error) {
//         console.error("error:",error)
//     }
// })()
