import {app, connection} from '../src/app'
import supertest from 'supertest';

describe("GET /teste", () => {
    it("returns 201 for tests", async () => {
        const result = await supertest(app).get("/teste");
        expect(result.status).toEqual(200);
    });
});