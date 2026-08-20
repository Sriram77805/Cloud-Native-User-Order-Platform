const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_URL = "http://localhost:3000";

let mongod;
let createApp;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URL);

  createApp = require("../app");
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

function extractCookies(res) {
  return res.headers["set-cookie"] || [];
}

async function registerAndLogin(agent, email = "user@example.com", password = "Password123") {
  const res = await agent.post("/auth/register").send({ email, password });
  const csrfToken = res.body.csrfToken;
  return csrfToken;
}

describe("Auth", () => {
  it("rejects registration with a weak password", async () => {
    const res = await request(app).post("/auth/register").send({ email: "a@b.com", password: "short" });
    expect(res.status).toBe(422);
  });

  it("registers, sets httpOnly cookies, and returns a CSRF token", async () => {
    const res = await request(app).post("/auth/register").send({ email: "a@b.com", password: "Password123" });
    expect(res.status).toBe(201);
    expect(res.body.csrfToken).toBeDefined();
    const cookies = extractCookies(res).join(";");
    expect(cookies).toMatch(/accessToken=/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it("locks out after repeated failed logins", async () => {
    await request(app).post("/auth/register").send({ email: "lock@b.com", password: "Password123" });
    const agent = request.agent(app);
    for (let i = 0; i < 5; i += 1) {
      await agent.post("/auth/login").send({ email: "lock@b.com", password: "WrongPass1" });
    }
    const res = await agent.post("/auth/login").send({ email: "lock@b.com", password: "Password123" });
    expect(res.status).toBe(423);
  });
});

describe("Orders", () => {
  it("rejects order creation without auth", async () => {
    const res = await request(app).post("/orders").send({ product: "Widget", quantity: 1, price: 10 });
    expect(res.status).toBe(401);
  });

  it("rejects mutating requests missing a CSRF token even with a valid session", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/register").send({ email: "csrf@b.com", password: "Password123" });
    const res = await agent.post("/orders").send({ product: "Widget", quantity: 1, price: 10 });
    expect(res.status).toBe(403);
  });

  it("creates, lists, updates and soft-deletes an order end to end", async () => {
    const agent = request.agent(app);
    const csrfToken = await registerAndLogin(agent, "flow@b.com");

    const create = await agent
      .post("/orders")
      .set("X-CSRF-Token", csrfToken)
      .send({ product: "Widget", quantity: 2, price: 9.99 });
    expect(create.status).toBe(201);
    const orderId = create.body.order._id;
    expect(create.body.order.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);

    const list = await agent.get("/orders");
    expect(list.status).toBe(200);
    expect(list.body.orders).toHaveLength(1);
    expect(list.body.pagination.total).toBe(1);

    const invalidTransition = await agent
      .put(`/orders/${orderId}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ status: "delivered" });
    expect(invalidTransition.status).toBe(422); // pending -> delivered isn't allowed directly

    const validTransition = await agent
      .put(`/orders/${orderId}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ status: "shipped" });
    expect(validTransition.status).toBe(200);
    expect(validTransition.body.order.status).toBe("shipped");

    const del = await agent.delete(`/orders/${orderId}`).set("X-CSRF-Token", csrfToken);
    expect(del.status).toBe(200);

    const listAfterDelete = await agent.get("/orders");
    expect(listAfterDelete.body.orders).toHaveLength(0);
  });

  it("returns 400 for a malformed order id instead of a 500", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, "badid@b.com");
    const res = await agent.get("/orders/not-a-valid-id");
    expect(res.status).toBe(400);
  });

  it("prevents one user from accessing another user's order", async () => {
    const agentA = request.agent(app);
    const csrfA = await registerAndLogin(agentA, "usera@b.com");
    const created = await agentA
      .post("/orders")
      .set("X-CSRF-Token", csrfA)
      .send({ product: "Widget", quantity: 1, price: 5 });

    const agentB = request.agent(app);
    await registerAndLogin(agentB, "userb@b.com");
    const res = await agentB.get(`/orders/${created.body.order._id}`);
    expect(res.status).toBe(404); // scoped query - looks like it doesn't exist, not a leaked 403
  });
});
