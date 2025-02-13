require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs")
const User = require("./models/user");
const Person = require("./models/Person");

const app = express();
const port = process.env.port||3000;

//create public folder as static
//app.use("/public",isAuthenicated,express.static(path.join(__dirname,"public")));
app.use(express.static(path.join(__dirname,"public")));

//Set up middleware to parse json requests
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

//setup session variable
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false}//set to true if using https
}))

//create fake user in the database
// const user = {
//     admin:bcrypt.hashSync("12345", 10)
// }

function isAuthenicated(req,res,next){
    if(req.session.user){
        return next();
    }
    else{
        res.redirect("/login");
    }
}



//MongoDB connection setup
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error"));
db.once("open", ()=>{
    console.log("Connected to MongoDB Database");
});



//App Routes

app.get("/register", (req,res)=>{
    res.sendFile(path.join(__dirname,"public/register.html"));
})

app.post("/register", async (req,res)=>{
    try{
        const {username,email,password} = req.body;
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.send("username already taken. Try a differet one")
        }

        const hashedPassword = bcrypt.hashSync(password,10);
        const newUser = new User({username,email,password:hashedPassword});
        await newUser.save();

        res.redirect("/login");


    }catch(err){
        res.status(500).send("Error registering new user");
    }
})

app.get("/", (req,res)=>{
    res.sendFile("index.html");
});

app.get("/users",isAuthenicated, (req,res)=>{
    res.sendFile(path.join(__dirname,"/public/users.html"));
});

app.get("/login", (req,res)=>{
    res.sendFile(path.join(__dirname,"/public/login.html",));
})

app.get("/people", async (req, res)=>{
    try{
        const people = await Person.find();
        res.json(people);
        console.log(people);
    }catch(err){
        res.status(500).json({error:"Failed to get people."});
    }
});

app.get("/people/:id", async (req,res)=>{
    try{
        console.log(req.params.id);
        const person = await Person.findById(req.params.id);
        if(!person){
            return res.status(404).json({error:"{Person not found}"});
        }
        res.json(person);

    }catch(err){
        res.status(500).json({error:"Failed to get person."});
    }
});

app.post("/addperson",isAuthenicated, async (req,res)=>{
    try{
        const newPerson = new Person(req.body);
        const savePerson = await newPerson.save();
        console.log(savePerson);
        res.redirect("/users")
        //res.status(201).json(savePerson);
        console.log(savePerson);
    }
    catch(err){
        res.status(501).json({error:"failed to add new person"});
    }

});

app.post("/login",async(req,res)=>{
    const {username,password} = req.body;
    console.log(req.body);

    const user = await User.findOne({username});

    if(user && bcrypt.compareSync(password,user.password)){
        req.session.user = username;
        return res.redirect("/users");
    }
    req.session.error = "invalid user";
    return res.redirect("/login");
});

app.get("/logout",(req,res)=>{
    req.session.destroy(()=>{return res.redirect("/login")});
})

//update route
app.put("/updateperson/:id", (req,res)=>{

    //example of a promise statement for async function
    Person.findByIdAndUpdate(erq.params.id, req.body, {
        new:true,
        runValidators:true,
    }).then((updatedPerson)=>{
        if(!updatedPerson){
            return   res.status(404).json({error:"failed to find person"});
        }
        res.json(updatedPerson);
    }).catch((err)=>{
        res.status(400).json({error:"failed to update the person"});
    });


});

//delete
app.delete("/deleteperson/firstname", async (req,res)=>{
    try{
        const personName = req.query;
        const person= await Person.find(personName);
        if(person.length === 0){
            return res.status(404).json({error:"failed to find person"});
        }

        const deletedPerson = await Person.findOneAndDelete(personName);
        res.json({message:"person deleted successfully"});

    }catch(err){
        console.log(err);
        res.status(404).json({error:"person not found"});
    }
})


//Starts the server
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});

module.exports = app;
