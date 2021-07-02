import "../src/setup";
import { app, connection } from "../src/app";
import supertest from "supertest";

let token = "";

beforeEach(async () => {
  await connection.query(`DELETE FROM sessions`);
  await connection.query(`DELETE FROM users`);
  await connection.query(`DELETE FROM products`);
  await connection.query(`INSERT INTO products (name, "availableQuantity", price, description, image, "categoryId") 
  values ('Mouse sem fio', 300, 3000, 'Um excelente mouse sem fio', 'https://d1x5sfejm3zc3e.cloudfront.net/catalog/product/cache/b3b166914d87ce343d4dc5ec5117b502/X/6/X6W31AA-1_T1580145286.png', 1), 
  ('Mouse', 300, 3000, 'Um excelente mouse', 'https://resource.logitech.com/content/dam/logitech/en/products/mice/m190-wireless-mouse/m190-wireless-mouse-blue-gallery-01.png', 1), 
  ('Teclado', 5, 10000, 'Um excelente teclado', 'https://d1x5sfejm3zc3e.cloudfront.net/catalog/product/cache/b3b166914d87ce343d4dc5ec5117b502/2/U/2UN30AA-1_T1577735765.png', 1);
  `);
  const body = {
    email: "christian@teste.com",
    name: "Christian",
    password: "ChristianPassword",
  };

  await supertest(app).post("/sign-up").send(body);

  const bodyLogin = {
    email: "christian@teste.com",
    password: "ChristianPassword",
  };
  token = await supertest(app).post("/sign-in").send(bodyLogin);
});

describe("GET /product", () => {
  it("returns 200 and a array of products for valid token", async () => {
    const result = await supertest(app)
      .get("/product")
      .set("Authorization", `Bearer ${token.text}`);
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          availableQuantity: expect.any(Number),
          categoryId: expect.any(Number),
          description: expect.any(String),
          id: expect.any(Number),
          image: expect.any(String),
          name: expect.any(String),
          price: expect.any(Number),
        }),
      ])
    );
  });

    it("returns 200 and a array of products for valid token and queryString", async () => {
      const result = await supertest(app)
        .get("/product?name=mou")
        .set("Authorization", `Bearer ${token.text}`);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            availableQuantity: expect.any(Number),
            categoryId: expect.any(Number),
            description: expect.any(String),
            id: expect.any(Number),
            image: expect.any(String),
            name: "Mouse",
            price: expect.any(Number),
          }),
        ])
      );
    });

  it("returns 401 when there's no token", async () => {
    const result = await supertest(app)
      .get("/product")
      .set("Authorization", ``);
    expect(result.status).toEqual(401);
  });

  it("returns 404 when the token is invalid", async () => {
    const result = await supertest(app)
      .get("/product")
      .set("Authorization", `Bearer ${token.text}invalid`);
    expect(result.status).toEqual(404);
  });
});

afterAll(async () => {
  connection.end();
});
