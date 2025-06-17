import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import axios from "axios"; 

const app = express();
const port = 3000;

// Middleware setup
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password:"domadb11223344_",
  port: 5432,
});

//database connection 
db.connect().then(() => {
  console.log("Connected to database.");
}).catch(err => {
  console.error("Database connection error:", err.stack);
});


async function fetchCoverBookId(title, author) {
  try {
    const result = await axios.get('https://openlibrary.org/search.json', {
      params: { title, author }
    });

    // Find the first book where title and author match (or partial match) and has cover_i
    const book = result.data.docs.find(b => 
      b.cover_i &&
      b.title.toLowerCase().includes(title.toLowerCase()) &&
      b.author_name?.some(a => a.toLowerCase().includes(author.toLowerCase()))
    );

    if (book) {
      console.log(`Found cover id: ${book.cover_i}`);
      return book.cover_i;
    } else {
      console.log("No book with cover found matching title and author");
      return null;
    }
  } catch (err) {
    console.error("Error fetching the book cover", err);
    return null;
  }
}

//routes
app.get("/insert", (req, res) => {
  res.render("create.ejs"); // create.ejs contains your form for adding books/reviews
});



//post method to add new books 
app.post("/add_books", async (req, res) => {
  const {
    username,
    title,
    author,
    rating,
    review,
    date_read,
  } = req.body;

  try {
    // Check if user exists
    const userResult = await db.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );

    let user_id;
    if (userResult.rows.length === 0) {
      const insertUser = await db.query(
        "INSERT INTO users(username) VALUES ($1) RETURNING id",
        [username]
      );
      user_id = insertUser.rows[0].id;
    } else {
      user_id = userResult.rows[0].id;
    }

    // Check if book exists
    const bookResult = await db.query(
      "SELECT id FROM books WHERE title=$1 AND author=$2",
      [title, author]
    );

    let book_id;
    if (bookResult.rows.length === 0) {

        const cover_id=await fetchCoverBookId(title,author);


      const insertBook = await db.query(
        "INSERT INTO books(title, author, cover_id) VALUES ($1, $2, $3) RETURNING id",
        [title, author, cover_id]
      );
      book_id = insertBook.rows[0].id;
    } else {
      book_id = bookResult.rows[0].id;
    }

    // Insert into user_books
    await db.query(
      "INSERT INTO user_books(user_id, book_id, rating, review, date_read) VALUES ($1, $2, $3, $4, $5)",
      [user_id, book_id, rating, review, date_read]
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error performing operation:", err.stack);
    res.status(500).send("Something went wrong while adding the book.");
  }
});


//get-route
app.get("/", async (req, res) => {
  try {
    // Get all books with their cover_id, title, author from DB
    const result = await db.query("SELECT * FROM books");
    const result2=await db.query("SELECT * FROM user_books")
    const books = result.rows;
    const userBooks=result2.rows;
    console.log(userBooks);
    res.render("index.ejs", { books, userBooks}); // pass the array of books to EJS
  } catch (err) {
    console.error("Error loading home page:", err.stack);
    res.status(500).send("Error loading the home page.");
  }
});




//delete route
app.post("/delete", async (req,res)=>{
  let bookID=req.body.deleteItemId;
 console.log(bookID)
  try{
  await db.query("DELETE FROM books WHERE id=$1", [bookID])
  console.log("deleting book with id: ",[bookID]);

  res.redirect("/");
  }
  catch(err){
    console.log("there was an error deleting your task: " , err.stack)
  }
  
})
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
