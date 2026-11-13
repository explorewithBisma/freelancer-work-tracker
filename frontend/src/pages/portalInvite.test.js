// "Invite to Client Portal" is a FREELANCER action: it must carry the freelancer token.
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Clients from "./Clients";
import api from "../api/axios";

const calls = [];

beforeEach(() => {
  calls.length = 0;
  localStorage.clear();
  localStorage.setItem("access_token", "FREELANCER-TOKEN");
  localStorage.setItem("client_token", "CLIENT-TOKEN"); // both sessions exist in this browser

  // Stub only the network layer; the real freelancer `api` instance (with its interceptors) is used.
  api.defaults.adapter = (config) => {
    calls.push(config);
    let data = {};
    if (config.method === "get" && config.url === "/clients") {
      data = [{ id: 7, name: "Acme", email: "acme@example.com", company: "Acme Inc", created_at: "2026-01-01T00:00:00" }];
    } else if (config.method === "post" && config.url === "/clients/7/portal-invite") {
      data = { message: "Invitation sent to acme@example.com.", email_sent: true };
    }
    return Promise.resolve({ status: 200, data, headers: {}, config, statusText: "OK" });
  };
});

test("portal invite is POST /clients/{id}/portal-invite and carries the freelancer token (not the client token)", async () => {
  render(<MemoryRouter><Clients /></MemoryRouter>);

  fireEvent.click(await screen.findByTitle("Set Portal Access"));
  fireEvent.click(await screen.findByRole("button", { name: /send invitation/i }));

  expect(await screen.findByText(/invitation sent to acme@example.com/i)).toBeInTheDocument();

  const invite = calls.find((c) => c.method === "post" && c.url.includes("portal-invite"));
  expect(invite).toBeDefined();
  expect(invite.url).toBe("/clients/7/portal-invite");
  expect(invite.url).not.toContain("/client-portal");
  expect(invite.headers.Authorization).toBe("Bearer FREELANCER-TOKEN");
  expect(invite.headers.Authorization).not.toContain("CLIENT-TOKEN");
});
