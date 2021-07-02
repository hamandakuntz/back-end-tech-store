import setup from '../src/setup.js';
import { app, connection } from "../src/app";
import supertest from "supertest";

beforeEach(async () => {
  await connection.query(`DELETE FROM sessions`);
});

async () => {
  const body = {
    email: "christian@teste.com",
    name: "Christian",
    password: "ChristianPassword",
  };

  await supertest(app).post("/sign-up").send(body);
};


describe("POST /sign-in", () => {
  it("returns 200 and a token for valid inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(200);
    expect(result.text).toEqual(expect.any(String))
  });

  it("returns 400 for invalid inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      password: "Chris", // less than 6 chars
    };
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for invalid inputs (email, name, password)", async () => {
    const body = {
      email: "christian", // not a valid email
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for missing inputs (email, name, password)", async () => {
    const body = {
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for missing inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
    };
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 401 for e-mail that does not exist or password incompatible", async () => {
    const body = {
      email: "christian@testeteste.com",
      password: "ChristianPassword",
    };
    await supertest(app).post("/sign-in").send(body);
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(401);
  });

  it("returns 401 for e-mail that does not exist or password incompatible", async () => {
    const body = {
      email: "christian@teste.com",
      password: "ChristianPasswordTeste",
    };
    await supertest(app).post("/sign-in").send(body);
    const result = await supertest(app).post("/sign-in").send(body);
    expect(result.status).toEqual(401);
  });
});

afterAll( async () => {
  await connection.query(`DELETE FROM users`);
  connection.end();
});
