// Demo UI: one-click freelancer demo, client demo, and the demo banner.
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Login from "./Login";
import ClientLogin from "./clientlogin";
import ClientRoute from "../auth/ClientRoute";
import Layout from "../components/layout";
import { AuthProvider } from "../auth/AuthContext";
import api from "../api/axios";
import portalApi from "../api/portalAxios";

jest.mock("../components/ChatWidget", () => () => <div>FREELANCER-CHATWIDGET</div>);

let mockUser = { full_name: "Free Lancer", is_demo: false };
jest.mock("../auth/AuthContext", () => {
  const actual = jest.requireActual("../auth/AuthContext");
  return { ...actual, useAuth: jest.fn() };
});

const Probe = ({ label }) => <div>{label}</div>;
const calls = [];
let demoLoginStatus = 200;

beforeEach(() => {
  calls.length = 0;
  demoLoginStatus = 200;
  localStorage.clear();
  mockUser = { full_name: "Free Lancer", is_demo: false };

  // Freelancer demo: stub the network layer of the REAL api instance.
  api.defaults.adapter = (config) => {
    calls.push(config);
    const reply = (status, data) => {
      const response = { status, data, headers: {}, config, statusText: "" };
      if (status >= 400) { const e = new Error("fail"); e.config = config; e.response = response; return Promise.reject(e); }
      return Promise.resolve(response);
    };
    if (config.url === "/auth/demo-login") {
      return demoLoginStatus === 200
        ? reply(200, { access_token: "DEMO-TOKEN", token_type: "bearer" })
        : reply(demoLoginStatus, { detail: "The demo is not available right now." });
    }
    return reply(200, {});
  };

  const { useAuth } = require("../auth/AuthContext");
  const actual = jest.requireActual("../auth/AuthContext");
  // The login flow uses the real provider logic (stores the token); layout tests use a fake user.
  useAuth.mockImplementation(() => ({
    isAuth: true, user: mockUser, logout: jest.fn(),
    login: (t) => localStorage.setItem("access_token", t), actualAuth: actual,
  }));
});

describe("freelancer demo button", () => {
  const renderLogin = () =>
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Probe label="FREELANCER-DASHBOARD" />} />
        </Routes>
      </MemoryRouter>
    );

  test("one click: POST /auth/demo-login (no credentials), token stored, lands on the dashboard", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /try the demo/i }));
    expect(await screen.findByText("FREELANCER-DASHBOARD")).toBeInTheDocument();
    const call = calls.find((c) => c.url === "/auth/demo-login");
    expect(call.method).toBe("post");
    expect(call.data).toBeUndefined(); // no password / credentials sent
    expect(localStorage.getItem("access_token")).toBe("DEMO-TOKEN");
  });

  test("demo unavailable: inline error, no token, stays on the login page", async () => {
    demoLoginStatus = 404;
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /try the demo/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/demo is not available/i);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(screen.queryByText("FREELANCER-DASHBOARD")).not.toBeInTheDocument();
  });

  test("the bundle contains no demo password setting (REACT_APP_DEMO_PASSWORD is not used)", () => {
    expect(process.env.REACT_APP_DEMO_PASSWORD).toBeUndefined();
  });
});

describe("client demo button", () => {
  const renderClientLogin = () =>
    render(
      <MemoryRouter initialEntries={["/client-login"]}>
        <Routes>
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client-portal" element={<ClientRoute><Probe label="CLIENT-PORTAL" /></ClientRoute>} />
          <Route path="/login" element={<Probe label="FREELANCER-LOGIN" />} />
        </Routes>
      </MemoryRouter>
    );

  test("one click: POST /client-portal/demo-login, client token stored, lands on the portal", async () => {
    portalApi.defaults.adapter = (config) => {
      calls.push(config);
      return Promise.resolve({ status: 200, data: { access_token: "DEMO-CLIENT-TOKEN", token_type: "bearer" }, headers: {}, config, statusText: "" });
    };
    renderClientLogin();
    fireEvent.click(screen.getByRole("button", { name: /try the client demo/i }));
    expect(await screen.findByText("CLIENT-PORTAL")).toBeInTheDocument();
    expect(calls.find((c) => c.url === "/client-portal/demo-login").method).toBe("post");
    expect(localStorage.getItem("client_token")).toBe("DEMO-CLIENT-TOKEN");
    expect(localStorage.getItem("access_token")).toBeNull(); // freelancer session untouched
    expect(screen.queryByText("FREELANCER-LOGIN")).not.toBeInTheDocument();
  });

  test("client demo unavailable: inline error, no redirect to the freelancer login", async () => {
    portalApi.defaults.adapter = (config) => {
      const response = { status: 404, data: { detail: "The client demo is not available right now." }, headers: {}, config, statusText: "" };
      const e = new Error("fail"); e.config = config; e.response = response; return Promise.reject(e);
    };
    renderClientLogin();
    fireEvent.click(screen.getByRole("button", { name: /try the client demo/i }));
    expect(await screen.findByText(/client demo is not available/i)).toBeInTheDocument();
    expect(screen.queryByText("FREELANCER-LOGIN")).not.toBeInTheDocument();
    expect(localStorage.getItem("client_token")).toBeNull();
  });
});

describe("demo banner", () => {
  const renderLayout = (path) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Probe label="PAGE" />} />
            <Route path="/client-login" element={<Probe label="PAGE" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  const BANNER = /you're using a demo account — data resets daily/i;

  test("shown inside the app for the demo user", () => {
    mockUser = { full_name: "Demo Freelancer", is_demo: true };
    renderLayout("/dashboard");
    expect(screen.getByText(BANNER)).toBeInTheDocument();
  });

  test("not shown for a normal user", () => {
    renderLayout("/dashboard");
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
  });

  test("not shown on client pages, even if the demo freelancer is signed in", () => {
    mockUser = { full_name: "Demo Freelancer", is_demo: true };
    renderLayout("/client-login");
    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
  });
});

// keep lint quiet about helpers used only by the mocks above
void AuthProvider; void waitFor;
