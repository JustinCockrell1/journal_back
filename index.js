require("dotenv").config();
const express = require("express")
const mongoose = require("mongoose");

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

const daySchema = {
    date:Date,
    entries:[{type:String}],
    tasks:[{type:taskSchema}]
};

const userSchema = new mongoose.Schema({
    name:{
        required:true,
        unique:true,
        type:String,
    },
    password:String,
    days:[{type:daySchema}]
});

const User = new mongoose.model("User", userSchema);



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


app.listen(3000 || process.env.PORT, ()=>{
    console.log("app is running");
});