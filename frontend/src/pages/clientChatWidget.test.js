// The portal chat endpoint now requires the client token; the widget must send it and
// handle a rejected session gracefully.
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ClientChatWidget from "./ClientChatWidget";

const clientData = { client: { name: "Jane Client" }, summary: {}, projects: [], invoices: [] };

function send(text) {
  fireEvent.click(document.querySelector(".cw-fab"));                       // open the widget
  fireEvent.change(screen.getByPlaceholderText(/ask about your project/i), { target: { value: text } });
  fireEvent.click(document.querySelector(".cw-send-btn"));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("client_token", "CLIENT-TOKEN");
  localStorage.setItem("access_token", "FREELANCER-TOKEN");
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

test("sends the CLIENT token (never the freelancer token) to /chat/client-message", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ reply: "Hi from the bot" }) });
  render(<ClientChatWidget clientData={clientData} />);
  send("How are my projects?");
  expect(await screen.findByText("Hi from the bot")).toBeInTheDocument();
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toMatch(/\/chat\/client-message$/);
  expect(opts.headers.Authorization).toBe("Bearer CLIENT-TOKEN");
});

test("a rejected session (401) shows a session-expired message and clears only the client token", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ detail: "Invalid token" }) });
  render(<ClientChatWidget clientData={clientData} />);
  send("How are my projects?");
  expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
  expect(localStorage.getItem("client_token")).toBeNull();
  expect(localStorage.getItem("access_token")).toBe("FREELANCER-TOKEN");
});

test("a friendly rate-limit reply from the server is shown as-is", async () => {
  const msg = "You've reached today's assistant limit (50 messages). Please try again tomorrow.";
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ reply: msg }) });
  render(<ClientChatWidget clientData={clientData} />);
  send("one more");
  expect(await screen.findByText(msg)).toBeInTheDocument();
});
