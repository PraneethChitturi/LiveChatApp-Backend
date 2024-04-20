//To Run a server -> node server.js
//If errors come that say app requires middleware -> npm i nodemon -g; Add "start":"nodemon server.js" to scripts section in 'package-json' file
//'sudo' keyword in front overthrows all Access errors

const app = require("./app");
const dotenv = require("dotenv")
const http = require("http");
const mongoose = require("mongoose")

DeviceMotionEvent.config({path:"./config.env"}) //Connecting to config.env file for critical info


process.on("uncaughtException",(err)=>{ //Event listener to catch errors
    console.log(err);
    process.exit(1);
})

const server = http.createServer(app);

const DB = process.env.DBURI.replace("<PASSWORD>",process.env.DBPASSWORD)
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedToplogy:true,
}).then((con)=>{
    console.log("DB connection is successful");
}).catch((err)=>{
    console.log(err)
})

process.on ("unhandledRejection",(err)=>{
    console.log(err);
    server.close(()=>{
        process.exit(1);
    })
})

//ports available on computer 3000,5000
const port = process.env.PORT || 8000

server.listen(port,()=>{
    console.log(`App running on port ${port}`);
})