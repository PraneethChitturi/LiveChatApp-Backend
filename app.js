const express = require('express'); //web framework built on top of Node.js to help with Backend RESTFul APis buuild, figure out Routes

const morgan = require('morgan') //package to track server performance, time it takes to response, output we are sending, utilization

//Security 
const rateLimit = require("express-rate-limit") //Making highnumber of requests from same IP, server could crash - hence limiting number of requests 
const helmet = require("helmet") // Sets up various hTTP headers for requests, helps in security
const mongosanitize=require("express-mongo-sanitize") //Sanitizing data input from customers, cleaning input data

const bodyParser =require("body-parser") //Parses body of Input we get, before it sents down to handler in any of server

const xss = require("xss") //Sanitize untrusted HTML input from User, Malicious code

const cors = require("cors"); //Allow cross-origin requests - if Frontend hosts on tawk.com and Backend on api.tawk.com - so these are different domains
                                // so to communicate between them we use 'cors'

const app = express();
app.use(express.urlencoded({ //Parse uRL encoded bodies in Input
    extended:true
}))

app.use(mongosanitize());
//app.use(xss())

//Middleware is the handler that will be used in any requests, its the middle step between Input and Processing - we need to 'USE' to utlize them
app.use(cors({
    origin:"*", //Allows requests from all domains
    methods:["GET","PATCH","POST","DELETE","PUT"], //only allows requests of these methods
    credentials:true,
}))

app.use(express.json({limit:"10kb"})); //Limit amount of data we receive for each request
app.use(bodyParser.json()); //Parses JSON input data
app.use(bodyParser.urlencoded({extended:true})); //URL encoded data is also parsed

app.use(helmet()); //Setup Headers in responses

if (process.env.NODE_ENV==='development'){ //Only use in development mode for tracking
    app.use(morgan("dev"));
}

const limiter=rateLimit({ //Limits rate of Input
    max: 3000,
    windowMs: 60*60*1000, //In one hour
    message: "Too many Requests from this IP, Please try again in 1 hour"
})

app.use("/tawk",limiter) //Any requests that starts with /Tawk <- on that this limit will be implemented


module.exports = app;
