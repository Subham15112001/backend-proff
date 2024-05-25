import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import { app } from "./app.js";
const port = process.env.PORT || 8000;

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log(`server is running on port ${port}`)
    })
})
.catch((err)=>{
    console.log("server is not running",err)
})


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
