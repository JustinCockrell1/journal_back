require("dotenv").config();
const express = require("express")
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


mongoose.connect(`mongodb+srv://admin-justin:${process.env.MONGOPASSWORD}@cluster0.oja3d.mongodb.net/journalDB?retryWrites=true&w=majority`);

const taskSchema = {
    timestamp:Number,
    name:String,
}
const taskListSchema = {
    name:String,
    status:String,
    totalTime:Number,
}

const daySchema = {
    date:{
        type:Date,
    },
    entries:[{type:String}],
    tasks:[{type:taskSchema}],
    taskList:[{type:taskListSchema}]
};

const userSchema = new mongoose.Schema({
    email:{
        required:true,
        unique:true,
        type:String,
    },
    fullName:String,
    password:String,
    days:[{type:daySchema}],
    currentTask:taskSchema,
});

const User = new mongoose.model("User", userSchema);

const isAuth = (req, res, next) => {
   
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
        jwt.verify(req.headers.authorization.split(' ')[1], process.env.SECRET, function(err, decode) {
            if(err) {
                res.status(500).json({message:"couldn't decode token"});
                console.log("Hello");
            }
            else {
                req.user = decode;
                next();    
            }
        });
      } else {
        res.status(401).json({message:"Unauthorized"});
      }
}

app.post("/register", (req, res)=>{
    console.log(req.body);
    User.findOne({email:req.body.email}, (err, u) =>{
        console.log("Hello");
        if(err) {
            return res.json({message:err});
        }
        if(u) {
            res.json({message:"User already exists"});
        }
        else {
            bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
               
                if(err) {
                    return res.json({message:"failed to save password"});
                   
                }

                const user = new User({email:req.body.email, fullName:req.body.name, password:hash, days:[]});
                user.save((err)=>{
                    if(err) {
                        res.json({message:err});
                        console.log("error");
                    }
                    else res.json({message:"Successfully created new account"});
                });
            });
        }
    })


  
});

app.post("/login", (req, res)=>{
    User.findOne({email:req.body.email}, (err, user)=>{
        if(err) {
            return console.log(err);
        }

        if(!user) {
            return res.json({message:"A user with that email doesn't exist"});
        }

        bcrypt.compare(req.body.password, user.password, (err, same)=>{
            if(same) {
                res.json({message:"Successfully logged in", token:jwt.sign({id:user._id}, process.env.SECRET, {expiresIn:"1h"})});
            }
            else {
                res.json({message:"Invalid password"});
            }
        })
    });
});

app.post("/task", isAuth, (req, res)=>{
console.log(req.user.id);
    User.findOne({_id:req.user.id},(err, user)=>{
        if(err) {
            return console.log(err);
        }
        const todaysDate = new Date();
        todaysDate.setHours(0,0,0,0);
        
        let dayIndex = user.days.findIndex((d)=>d.date.getTime()===todaysDate.getTime());

        if(dayIndex==-1) {
            user.days.push({date:todaysDate, entries:[], tasks:[]});
            dayIndex = user.days.length-1;
        }
    
        const task = {name:req.body.name, timestamp:req.body.timestamp};

        user.days[dayIndex].tasks.push(task);
        
        user.currentTask = task;

        user.save((err)=>{
            if(err)console.log(err);
        });
        res.json({message:"Successfully added task"});
    })


});


app.get("/", (req, res)=>{
    const user = new User({name:"Hello", password:"pass"});
    user.save();
    res.send("hello");
});

app.post("/entry", (req, res)=>{
    const entry = req.body.entry;

    User.findOne({name:"Hello"}, (err, user)=>{
        if(!err) {
            console.log(entry);
        user.entries.push(entry);
        user.save();
        res.send("successfully saved");
        }
        else {
            res.send("error");
        }
    });

});


app.listen(3001 || process.env.PORT, ()=>{
    console.log("app is running");
});