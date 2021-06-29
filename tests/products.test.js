import {app, connection} from '../src/app'
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { it } from '@jest/globals';

const fakeUser = { name: 'Test User', email: 'test@test.com', password: "123456"};
const fakeToken = "1234";
const authHeader = `Bearer ${fakeToken}`;

beforeAll(async () => {
    await connection.query(`DELETE FROM users`);

    await connection.query(`DELETE FROM sessions`);

    const hash = bcrypt.hashSync(fakeUser.password, 10);

    const user = await connection.query(`
        INSERT INTO users (name, email, password) VALUES
        ($1, $2, $3) RETURNING id`
    , [fakeUser.name, fakeUser.email, hash]);

    await connection.query(`
    INSERT INTO sessions ("userId", token) VALUES ($1, $2)`, 
    [user.rows[0].id, fakeToken]);
    
    await connection.query(`
    INSERT INTO products (name, "availableQuantity", price, description, image, "categoryId")
    VALUES ($1, $2, $3, $4, $5, $6)`, 
    ['TESTING NAME ITEM', 700, 5000, 'TESTING DESCRIPTION', 'TESTING IMAGE', 1]);
})

describe("GET /product/id", () => {    
    it("returns 200 for a authenticated user", async () => {
        const result = await supertest(app).get("/product/1").set ("Authorization", authHeader);
        expect(result.status).toEqual(200);
    });

    it("returns 400 for a non sended token in the requisition", async () => {      
        const result = await supertest(app).get("/product/1");
        expect(result.status).toEqual(400);
    });

    it("returns 401 for a unauthorized token", async () => {
        const newAuthHeader = "Bearer 123";
        const result = await supertest(app).get("/product/1").set ("Authorization", newAuthHeader);
        expect(result.status).toEqual(401);
    });

    it("returns 404 for a non existing id product", async () => {   
        const id = parseInt("999999999");

        await connection.query(`
            SELECT * FROM products 
            WHERE "productId" = $1            
        `, [id]);   

        const result = await supertest(app).get(`/product/${id}`).set ("Authorization", authHeader);
        expect(result.status).toEqual(404);
    });
});

afterAll( async () => {   
    await connection.query(`DELETE FROM users`);
    await connection.query(`DELETE FROM sessions`);
    await connection.query(`DELETE FROM products`);
    connection.end();
});