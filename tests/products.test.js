import {app, connection} from '../src/app'
import supertest from 'supertest';
import bcrypt from 'bcrypt';

const fakeUser = { name: 'Test User', email: 'test@test.com', password: "123456"};
const fakeToken = "1234";
const authHeader = `Bearer ${fakeToken}`;
let fakeProductId = null;

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
    
    fakeProductId = await connection.query(`
    INSERT INTO products (name, "availableQuantity", price, description, image, "categoryId")
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING "productId"`, 
    ['TESTING NAME ITEM', 700, 5000, 'TESTING DESCRIPTION', 'https://blog.bydoor.com/wp-content/uploads/2016/10/verdades-e-mitos-sobre-regras-internas-do-condominio.jpeg', 1]);
});

describe("GET /product/id", () => {    
    it("returns 200 for a authenticated user", async () => {
        const result = await supertest(app).get(`/product/${fakeProductId.rows[0].productId}`).set("Authorization", authHeader);
        expect(result.status).toEqual(200);
    });

    it("returns 400 for a non sended token in the requisition", async () => {      
        const result = await supertest(app).get(`/product/${fakeProductId.rows[0].productId}`);
        expect(result.status).toEqual(400);
    });

    it("returns 401 for a unauthorized token", async () => {
        const newAuthHeader = "Bearer 123";
        const result = await supertest(app).get(`/product/${fakeProductId.rows[0].productId}`).set("Authorization", newAuthHeader);
        expect(result.status).toEqual(401);
    });

    it("returns 404 for a non existing id product", async () => {   
        const id = parseInt("999999999");

        await connection.query(`
            SELECT * FROM products 
            WHERE "productId" = $1            
        `, [id]);   

        const result = await supertest(app).get(`/product/${id}`).set("Authorization", authHeader);
        expect(result.status).toEqual(404);
    });
   
    it("returns the expected object info", async () => { 
        const result = await supertest(app).get(`/product/${fakeProductId.rows[0].productId}`).set("Authorization", authHeader); 
        expect(result.body).toEqual(expect.objectContaining({"name": expect.any(String), "availableQuantity": expect.any(Number), "price": expect.any(Number),
        "description": expect.any(String), "image": expect.any(String), "categoryId": expect.any(Number)})); 
    });
});

afterAll( async () => {   
    await connection.query(`
    DELETE FROM users`);   
    await connection.query(`
    DELETE FROM sessions`); 
    await connection.query(`
    DELETE FROM products`);    
    connection.end();
});