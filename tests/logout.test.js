import "../src/setup";
import { app, connection } from "../src/app";
import supertest from "supertest";

let token = "";

beforeEach(async () => {
  await connection.query(`DELETE FROM sessions`);
  await connection.query(`DELETE FROM users`);

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

describe("POST /logout", () => {
  it("returns 200 for sucessful logout", async () => {
    const result = await supertest(app)
      .post("/logout")
      .set("Authorization", `Bearer ${token.text}`);
    expect(result.status).toEqual(200);
  });

  it("returns 401 when there's no token", async () => {
    const result = await supertest(app)
      .post("/logout")
      .set("Authorization", ``);
    expect(result.status).toEqual(401);
  });

  it("returns 404 when the token is invalid", async () => {
    const result = await supertest(app)
      .post("/logout")
      .set("Authorization", `Bearer ${token.text}invalid`);
    expect(result.status).toEqual(404);
  });
});

afterAll(async () => {
  connection.end();
});
