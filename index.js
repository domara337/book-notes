import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";

const app = express();
const port = 3000;

// Middleware setup
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database setup
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes", // ensure this DB exists
  password: "domadb11223344_",
  port: 5432,
});

db.connect().then(() => {
  console.log("Connected to database.");
}).catch(err => {
  console.error("Database connection error:", err.stack);
});

// Routes
app.get("/insert", (req, res) => {
  res.render("create.ejs");
});

app.post("/add_books", async (req, res) => {
  const {
    username,
    title,
    author,
    cover_id,
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

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
