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

app.get("/teste", (req, res) => {
  res.sendStatus(200);
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
