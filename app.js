const Express = require('express');
const cors = require('cors');
const Mongoose = require('mongoose');
const Session = require('express-session');
const AuthRouter = require('./routes/AuthRouter');
const ImageRouter = require('./routes/Image64Router');
const RaiseTicketsAuthRouter = require('./routes/RaiseTickets')
const NotificationRouter = require('./routes/Notification')
const ResumeProcess = require('./routes/ResumeProcess')
const MongoDbSession = require('connect-mongodb-session')(Session);
require('dotenv').config();

const app = Express();
const port = process.env.Port || 4000;
 
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001','http://localhost:3002'],
    credentials: true
}));
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);  
})

Mongoose.connect(process.env.MongoDBURI)
.then(()=>{
    console.log('MongoDB connected succesfully!');
})
.catch((err)=>{
    console.log("Error in connecting to MongoDB:",err);
})

const store = new MongoDbSession({
    uri: process.env.MongoDBURI,
    collection: 'sessions'
})

app.use(Session({
    secret: process.env.SessionKey,
    resave: false,
    saveUninitialized: false,
    store: store
}))

app.use(AuthRouter)
app.use(RaiseTicketsAuthRouter)
app.use(NotificationRouter)
app.use(ImageRouter)
app.use(ResumeProcess)
