import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import joi from "joi";
import { v4 as uuid } from "uuid";
import { stripHtml } from "string-strip-html";
import databaseConfig from './database.js'

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const connection = new Pool(databaseConfig);

app.get("/teste", (req, res) => {
    res.sendStatus(200)
})

app.get("/product/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const existingId = await connection.query(
          `SELECT * FROM products WHERE "productId" = $1`, [id]
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
            WHERE "productId" = $1            
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

export { app, connection };
