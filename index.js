import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";



const app=express();
const port=3000;

//database_setup
const db=new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"book_notes",
    
})


//middleware setup
app.set('view engine' , 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));











app.get("/insert", (req,res)=>{
    res.render("create.ejs")
})



app.get("/", (req, res)=>{
    res.render("index.ejs")
})






app.listen(port, ()=>{
    console.log(`server is running at http://localhost:${port}`)
})