import setup from '../src/setup.js';
import { app, connection } from "../src/app";
import supertest from "supertest";

beforeEach(async () => {
  await connection.query(`DELETE FROM users`);
});

afterAll( async () => { 
  connection.end();
});

describe("POST /sign-up", () => {
  it("returns 201 for valid inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      name: "Christian",
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(201);
  });

  it("returns 400 for invalid inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      name: "Christian",
      password: "Chris", // less than 6 chars
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for invalid inputs (email, name, password)", async () => {
    const body = {
      email: "christian", // not a valid email
      name: "Christian",
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for invalid inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      name: "Ch", // less than 3 chars
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for missing inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for missing inputs (email, name, password)", async () => {
    const body = {
      name: "Christian",
      password: "ChristianPassword",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 400 for missing inputs (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      name: "Christian",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(400);
  });

  it("returns 409 for email that is already registered (email, name, password)", async () => {
    const body = {
      email: "christian@teste.com",
      name: "Christian",
      password: "ChristianPassword",
    };
    await supertest(app).post("/sign-up").send(body);
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(409);
  });
});
