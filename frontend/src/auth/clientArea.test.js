// Client area: guards, login flow, layout shell, and session independence.
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ClientRoute from "./ClientRoute";
import ClientLogin from "../pages/clientlogin";
import Layout from "../components/layout";
import { AuthProvider, useAuth } from "./AuthContext";
import { clearClientToken, getClientToken, isClientAreaPath } from "./clientSession";
import portalApi from "../api/portalAxios";

jest.mock("../api/portalAxios", () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
jest.mock("../api/axios", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../components/ChatWidget", () => () => <div>FREELANCER-CHATWIDGET</div>);

// For Layout tests: pretend a freelancer is logged in.
let mockFreelancerAuth = true;
jest.mock("./AuthContext", () => {
  const actual = jest.requireActual("./AuthContext");
  return {
    ...actual,
    useAuth: jest.fn(),
  };
});

beforeEach(() => {
  // CRA's Jest config uses resetMocks, so mock implementations are re-applied per test.
  localStorage.clear();
  mockFreelancerAuth = true;
  require("./AuthContext").useAuth.mockImplementation(() => ({
    isAuth: mockFreelancerAuth, user: { full_name: "Free Lancer" }, logout: jest.fn(),
  }));
  require("../api/axios").default.get.mockResolvedValue({ data: {} });
});

const Probe = ({ label }) => <div>{label}</div>;

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/client-portal" element={<ClientRoute><Probe label="CLIENT-PORTAL-PAGE" /></ClientRoute>} />
        <Route path="/login" element={<Probe label="FREELANCER-LOGIN-PAGE" />} />
        <Route path="/dashboard" element={<Probe label="FREELANCER-DASHBOARD-PAGE" />} />
      </Routes>
    </MemoryRouter>
  );
}

const submitClientLogin = (email = "c@example.com", pwd = "ClientPw123") => {
  fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText("Your portal password"), { target: { value: pwd } });
  fireEvent.click(screen.getByRole("button", { name: /view my projects/i }));
};

describe("ClientRoute guard (client session only)", () => {
  test("no client session -> /client-login (never the freelancer /login)", () => {
    renderApp("/client-portal");
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.queryByText("FREELANCER-LOGIN-PAGE")).not.toBeInTheDocument();
  });

  test("a freelancer session alone does NOT grant access to the portal", () => {
    localStorage.setItem("access_token", "FREELANCER");
    renderApp("/client-portal");
    expect(screen.queryByText("CLIENT-PORTAL-PAGE")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
  });

  test("client session -> portal renders", () => {
    localStorage.setItem("client_token", "CLIENT");
    renderApp("/client-portal");
    expect(screen.getByText("CLIENT-PORTAL-PAGE")).toBeInTheDocument();
  });
});

describe("client login flow", () => {
  test("fresh session: successful login stores client_token and opens the portal (no /login redirect)", async () => {
    portalApi.post.mockResolvedValue({ data: { access_token: "NEW-CLIENT-TOKEN" } });
    renderApp("/client-login");
    submitClientLogin();
    expect(await screen.findByText("CLIENT-PORTAL-PAGE")).toBeInTheDocument();
    expect(portalApi.post.mock.calls[0][0]).toBe("/client-portal/login");
    expect(getClientToken()).toBe("NEW-CLIENT-TOKEN");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(screen.queryByText("FREELANCER-LOGIN-PAGE")).not.toBeInTheDocument();
  });

  test("wrong credentials: inline error on the same page, no redirect, no token stored", async () => {
    portalApi.post.mockRejectedValue({ response: { status: 401 } });
    renderApp("/client-login");
    submitClientLogin("c@example.com", "wrong");
    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.queryByText("FREELANCER-LOGIN-PAGE")).not.toBeInTheDocument();
    expect(getClientToken()).toBeNull();
  });

  test("freelancer logged in, client not: /client-login shows the CLIENT form (not the freelancer dashboard)", () => {
    localStorage.setItem("access_token", "FREELANCER");
    renderApp("/client-login");
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.queryByText("FREELANCER-DASHBOARD-PAGE")).not.toBeInTheDocument();
  });

  test("both sessions present: /client-login goes to the client portal and the freelancer session is untouched", () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    renderApp("/client-login");
    expect(screen.getByText("CLIENT-PORTAL-PAGE")).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBe("FREELANCER");
  });

  test("freelancer logs in on the client form while also a freelancer: both sessions coexist", async () => {
    localStorage.setItem("access_token", "FREELANCER");
    portalApi.post.mockResolvedValue({ data: { access_token: "CLIENT" } });
    renderApp("/client-login");
    submitClientLogin();
    expect(await screen.findByText("CLIENT-PORTAL-PAGE")).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBe("FREELANCER");
    expect(getClientToken()).toBe("CLIENT");
  });
});

describe("layout: client area has no freelancer shell", () => {
  const renderLayout = (path) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Layout />}>
            {["/client-login", "/client-portal", "/client-set-password", "/dashboard"].map((p) => (
              <Route key={p} path={p} element={<Probe label={`PAGE ${p}`} />} />
            ))}
          </Route>
        </Routes>
      </MemoryRouter>
    );

  test.each(["/client-login", "/client-portal", "/client-set-password"])(
    "%s: no sidebar, no freelancer card, no chat widget, no top bar — even with a freelancer logged in",
    (path) => {
      renderLayout(path);
      expect(screen.getByText(`PAGE ${path}`)).toBeInTheDocument();
      expect(screen.queryByText("Freelancer")).not.toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("FREELANCER-CHATWIDGET")).not.toBeInTheDocument();
      expect(screen.queryByText("FWT")).not.toBeInTheDocument();
    }
  );

  test("/dashboard still gets the full freelancer shell", () => {
    renderLayout("/dashboard");
    expect(screen.getByText("Freelancer")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("FREELANCER-CHATWIDGET")).toBeInTheDocument();
  });

  test("isClientAreaPath only matches client pages (not /clients)", () => {
    expect(["/client-login", "/client-portal", "/client-set-password"].every(isClientAreaPath)).toBe(true);
    expect(["/clients", "/clients/3", "/dashboard", "/login"].some(isClientAreaPath)).toBe(false);
  });
});

describe("sessions are independent", () => {
  test("clearing the client session leaves the freelancer session alone", () => {
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    clearClientToken();
    expect(localStorage.getItem("client_token")).toBeNull();
    expect(localStorage.getItem("access_token")).toBe("FREELANCER");
  });

  test("freelancer logout leaves the client session alone", async () => {
    const actualAuth = jest.requireActual("./AuthContext");
    localStorage.setItem("access_token", "FREELANCER");
    localStorage.setItem("client_token", "CLIENT");
    function LogoutButton() {
      const { logout } = actualAuth.useAuth();
      return <button onClick={logout}>do-logout</button>;
    }
    render(<actualAuth.AuthProvider><LogoutButton /></actualAuth.AuthProvider>);
    fireEvent.click(screen.getByText("do-logout"));
    await waitFor(() => expect(localStorage.getItem("access_token")).toBeNull());
    expect(localStorage.getItem("client_token")).toBe("CLIENT");
  });
});

// keep imports referenced so lint stays quiet
void AuthProvider; void useAuth;
