import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import joi from "joi";
import { v4 as uuid } from "uuid";
import { stripHtml } from "string-strip-html";
import databaseConfig from "./database.js";

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const connection = new Pool(databaseConfig);

app.post("/sign-up", async (req, res) => {
  try {
    cleanHTML(req.body)
    const validBody = schemeSignUp.validate(req.body);
    if (validBody.error) return res.sendStatus(400);
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);

    const result = await connection.query(
      `INSERT INTO users (name, email, password) 
          SELECT $1, $2, $3
          WHERE NOT EXISTS(
              SELECT 1 from users
              WHERE email = $2
          )`,
      [name, email, hash]
    );

    if (!result.rowCount) return res.sendStatus(409);
    res.sendStatus(201);
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }
});

app.post("/sign-in", async (req, res) => {
  try {
    cleanHTML(req.body);
    const validBody = schemeSignIn.validate(req.body);
    if (validBody.error) return res.sendStatus(400);
    const { email, password } = req.body;
    const result = await connection.query(
      `SELECT * FROM users
          WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = uuid();
      await connection.query(
        `INSERT INTO sessions ("userId", token)
          VALUES ($1, $2)`,
        [user.id, token]
      );
      res.send(token);
    } else {
      res.sendStatus(401);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.get("/product/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existingId = await connection.query(
          `SELECT * FROM products WHERE id = $1`, [id]
        ); 
        
        const authorization = req.headers['authorization'];
        const token = authorization?.replace('Bearer ', '');               
       
        const user = await connection.query(`
        SELECT * FROM sessions
        JOIN users
        ON sessions."userId" = users.id
        WHERE sessions.token = $1
        `, [token]);

        if(!token) return res.sendStatus(400);   

        if(!existingId.rows[0]) return res.sendStatus(404);
            
        if(user.rows[0] && existingId.rows[0]) {
            const result = await connection.query(`
            SELECT * FROM products 
            WHERE id = $1            
            `, [id])

            res.send({
                name: result.rows[0].name,
                availableQuantity: result.rows[0].availableQuantity,
                price: result.rows[0].price,
                description: result.rows[0].description,
                image: result.rows[0].image,
                categoryId: result.rows[0].categoryId
            });
            
        } else {
            res.sendStatus(401);
        }

    } catch(e) {       
        res.sendStatus(500);
    }   
});

app.get("/product", async (req, res) => {
  try {
    const { name } = req.query;
    const authorization = req.headers["authorization"];
    if (!authorization) return res.sendStatus(401);
    const token = authorization.replace("Bearer ", "");
    const resultToken = await connection.query(
      `SELECT * FROM sessions
        WHERE token = $1`,
      [token]
    );
    if (!resultToken.rowCount) return res.sendStatus(404);
    const resultProducts = await connection.query(
      `SELECT * FROM products ${name ? "WHERE name ILIKE $1" : ""}`,
      name ? [`%${name}%`] : ""
    );
    res.send(resultProducts.rows);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/logout", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) return res.sendStatus(401);
    const token = authorization.replace("Bearer ", "");
    const result = await connection.query(
      `DELETE FROM sessions
              WHERE token = $1
              RETURNING *`,
      [token]
    );
    if (!result.rowCount) return res.sendStatus(404);
    res.send(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

export { app, connection };

const schemeSignUp = joi.object({
  name: joi.string().min(3).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});

const schemeSignIn = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
})

function cleanHTML(objectHTML) {
  for (const keys in objectHTML) {
    if (typeof objectHTML[keys] === "string") {
      objectHTML[keys] = stripHtml(objectHTML[keys]).result.trim();
    }
  }
}
