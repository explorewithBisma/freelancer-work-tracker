// Verifies the freelancer and client-portal API instances keep their sessions separate.
import api from "./axios";
import portalApi from "./portalAxios";

// Replace the network layer: record the request, then resolve/reject with a chosen status.
function stub(instance, status = 200) {
  const calls = [];
  instance.defaults.adapter = (config) => {
    calls.push(config);
    const response = { status, data: {}, headers: {}, config, statusText: "" };
    if (status >= 400) {
      const err = new Error(`Request failed with status code ${status}`);
      err.config = config;
      err.response = response;
      return Promise.reject(err);
    }
    return Promise.resolve(response);
  };
  return calls;
}

const authHeader = (config) => config.headers?.Authorization;

let originalLocation;
beforeEach(() => {
  localStorage.clear();
  originalLocation = window.location;
  delete window.location;
  window.location = { pathname: "/projects", href: "http://localhost/projects" };
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  window.location = originalLocation;
  jest.restoreAllMocks();
});

describe("request tokens", () => {
  test("portalApi sends only the client token, even when a freelancer session exists", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    const calls = stub(portalApi);
    await portalApi.get("/client-portal/dashboard");
    expect(authHeader(calls[0])).toBe("Bearer CLIENT");
  });

  test("portalApi sends no Authorization header without a client session (freelancer token is never used)", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    const calls = stub(portalApi);
    await portalApi.get("/client-portal/dashboard");
    expect(authHeader(calls[0])).toBeUndefined();
  });

  test("freelancer api sends only the freelancer token", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    const calls = stub(api);
    await api.get("/projects/");
    expect(authHeader(calls[0])).toBe("Bearer FREELANCER");
  });

  test("freelancer api never attaches its token to /client-portal calls", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    const calls = stub(api);
    await api.get("/client-portal/dashboard");
    expect(authHeader(calls[0])).toBeUndefined();
  });
});

describe("401 handling", () => {
  test("client login 401: no redirect, tokens untouched, error reaches the form", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    stub(portalApi, 401);
    await expect(portalApi.post("/client-portal/login", "x")).rejects.toMatchObject({ response: { status: 401 } });
    expect(window.location.href).toBe("http://localhost/projects");
    expect(localStorage.getItem("access_token")).toBe("FREELANCER");
  });

  test("client dashboard 401 clears ONLY the client token and does not redirect", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    stub(portalApi, 401);
    await expect(portalApi.get("/client-portal/dashboard")).rejects.toBeTruthy();
    expect(localStorage.getItem("client_token")).toBeNull();
    expect(localStorage.getItem("access_token")).toBe("FREELANCER");
    expect(window.location.href).toBe("http://localhost/projects");
  });

  test("client dashboard 403 (not a client token) also clears only the client token", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "BAD");
    stub(portalApi, 403);
    await expect(portalApi.get("/client-portal/dashboard")).rejects.toBeTruthy();
    expect(localStorage.getItem("client_token")).toBeNull();
    expect(localStorage.getItem("access_token")).toBe("FREELANCER");
  });

  test("freelancer login 401: inline error path — no hard redirect, no token changes", async () => {
    localStorage.setItem("client_token", "CLIENT");
    stub(api, 401);
    await expect(api.post("/auth/login", "x")).rejects.toMatchObject({ response: { status: 401 } });
    expect(window.location.href).toBe("http://localhost/projects");
    expect(localStorage.getItem("client_token")).toBe("CLIENT");
  });

  test("freelancer 401 elsewhere: clears the freelancer token only and goes to /login", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    stub(api, 401);
    await expect(api.get("/projects/")).rejects.toBeTruthy();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("client_token")).toBe("CLIENT");
    expect(window.location.href).toBe("/login");
  });

  test("stale freelancer token 401 while on a client page: cleared, but NO redirect to /login", async () => {
    window.location = { pathname: "/client-login", href: "http://localhost/client-login" };
    localStorage.setItem("access_token", "STALE");
    localStorage.setItem("client_token", "CLIENT");
    stub(api, 401);
    await expect(api.get("/auth/me")).rejects.toBeTruthy();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("client_token")).toBe("CLIENT");
    expect(window.location.href).toBe("http://localhost/client-login");
  });
});
