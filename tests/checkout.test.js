import setup from '../src/setup.js';
import {app, connection} from '../src/app.js';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';

const fakeUser = { name: 'Test User2', email: 'test2@test.com', password: "123456"};
const fakeToken = "12345";
const authHeader = `Bearer ${fakeToken}`;
let fakeProductId = null;
let fakeBody = [];


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
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, 
    ['TESTING NAME ITEM', 700, 5000, 'TESTING DESCRIPTION', 'https://blog.bydoor.com/wp-content/uploads/2016/10/verdades-e-mitos-sobre-regras-internas-do-condominio.jpeg', 1]);
});

describe("POST /checkout", () => {    
    it("returns 200 for a authenticated user", async () => {     
        
        const body = {
            cpf: "12345678910",
            celNumber: "12345678910",
            adress: "testestestsetsetsettestset",
            payment: "Cartão de débito",
            total: 50000,
            cart: [{ id: fakeProductId.rows[0].id, quantity: 1}]
        }
        const result = await supertest(app).post(`/checkout`).set("Authorization", authHeader).send(body);
        expect(result.status).toEqual(200);
    });

    it("returns 400 for a validation error (cpf less than 11 numbers)", async () => {  
        const body = {
            cpf: "123456789",
            celNumber: "12345678910",
            adress: "testestestsetsetsettestset",
            payment: "Cartão de débito",
            total: 50000,
            cart: { id: 1, quantity: 1}
        } 
        const result = await supertest(app).post(`/checkout`).send(body);
        expect(result.status).toEqual(400);
    });

    it("returns 400 for a validation error (celNumber less than 10 or 11 numbers)", async () => {  
        const body = {
            cpf: "12345678910",
            celNumber: "1234567",
            adress: "testestestsetsetsettestset",
            payment: "Cartão de débito",
            total: 50000,
            cart: { id: 1, quantity: 1}
        } 
        const result = await supertest(app).post(`/checkout`).send(body);
        expect(result.status).toEqual(400);
    });

    it("returns 400 for a validation error (adress is not a text)", async () => {  
        const body = {
            cpf: "12345678910",
            celNumber: "12345678910",
            adress: 123,
            payment: "Cartão de débito",
            total: 50000,
            cart: { id: 1, quantity: 1}
        } 
        const result = await supertest(app).post(`/checkout`).send(body);
        expect(result.status).toEqual(400);
    });

    it("returns 400 for a validation error (payment is a invalid input)", async () => {  
        const body = {
            cpf: "12345678910",
            celNumber: "12345678910",
            adress: "testsetsettestsetsetsets",
            payment: "teste",
            total: 50000,
            cart: { id: 1, quantity: 1}
        } 
        const result = await supertest(app).post(`/checkout`).send(body);
        expect(result.status).toEqual(400);
    });

    it("returns 400 for a validation error (total is not a number)", async () => {  
        const body = {
            cpf: "12345678910",
            celNumber: "12345678910",
            adress: "testsetsettestsetsetsets",
            payment: "Cartão de débito",
            total: "teste",
            cart: { id: 1, quantity: 1}
        } 
        const result = await supertest(app).post(`/checkout`).send(body);
        expect(result.status).toEqual(400);
    });


    it("returns 400 for a validation error (cart is not sended)", async () => {  
        const body = {
            cpf: "12345678910",
            celNumber: "12345678910",
            adress: "testsetsettestsetsetsets",
            payment: "Cartão de débito",
            total: 5000            
        } 
        const result = await supertest(app).post(`/checkout`).send(body);
        expect(result.status).toEqual(400);
    });

    it("returns 400 for a validation error (a non sended token in the requisition)", async () => {            
        const result = await supertest(app).post(`/checkout`);
        expect(result.status).toEqual(400);
    });

    it("returns 404 for a non existing user", async () => {   
        const newAuthHeader = `Bearer 12`;
        const body = {
            cpf: "12345678910",
            celNumber: "12345678910",
            adress: "testestestsetsetsettestset",
            payment: "Cartão de débito",
            total: 50000,
            cart: [{ id: fakeProductId.rows[0].id, quantity: 1}]
        }
        const result = await supertest(app).post(`/checkout`).set("Authorization", newAuthHeader).send(body);
        expect(result.status).toEqual(404);
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
