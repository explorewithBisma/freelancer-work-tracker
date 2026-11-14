import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatMarkdown from "./ChatMarkdown";
import ClientChatWidget from "../pages/ClientChatWidget";

const html = (text, props = {}) => render(<ChatMarkdown text={text} {...props} />).container;

describe("ChatMarkdown rendering", () => {
  test("**bold** becomes <strong>, with no raw asterisks left", () => {
    const c = html("You have **3 active projects** today");
    expect(c.querySelector("strong").textContent).toBe("3 active projects");
    expect(c.textContent).toBe("You have 3 active projects today");
  });

  test("*italic* becomes <em>; italics inside bold work", () => {
    const c = html("This is *important* and **really *very* bold**");
    expect(c.querySelector("em").textContent).toBe("important");
    expect(c.querySelector("strong").querySelector("em").textContent).toBe("very");
    expect(c.textContent).not.toContain("*");
  });

  test("`inline code` becomes <code>", () => {
    expect(html("Run `npm start` now").querySelector("code").textContent).toBe("npm start");
  });

  test("bullet lists (-, *, •) become <ul><li>", () => {
    const c = html("Your tasks:\n- Design homepage\n* Build API\n• Write docs");
    const items = [...c.querySelectorAll("ul li")].map((li) => li.textContent);
    expect(items).toEqual(["Design homepage", "Build API", "Write docs"]);
    expect(c.textContent).not.toContain("- Design");
  });

  test("numbered lists become <ol><li>, and markdown works inside items", () => {
    const c = html("Steps:\n1. Open **Projects**\n2. Click *New*");
    expect([...c.querySelectorAll("ol li")].length).toBe(2);
    expect(c.querySelector("ol li strong").textContent).toBe("Projects");
  });

  test("line breaks and blank-line paragraphs are kept", () => {
    const c = html("Line one\nLine two\n\nSecond paragraph");
    expect(c.querySelectorAll("p").length).toBe(2);
    expect(c.querySelectorAll("p")[0].querySelectorAll("br").length).toBe(1);
  });

  test("# headings are shown bold (no raw #)", () => {
    const c = html("## Summary\nAll good");
    expect(c.querySelector("strong").textContent).toBe("Summary");
    expect(c.textContent).not.toContain("#");
  });

  test("unmatched / stray asterisks and snake_case stay as plain text", () => {
    expect(html("2 * 3 = 6 and my_var_name and **unclosed").textContent).toBe("2 * 3 = 6 and my_var_name and **unclosed");
  });

  test("plain mode (the user's own messages) shows text as typed, only line breaks", () => {
    const c = html("I typed **this**\nand this", { plain: true });
    expect(c.querySelector("strong")).toBeNull();
    expect(c.textContent).toBe("I typed **this**and this");
    expect(c.querySelectorAll("br").length).toBe(1);
  });
});

describe("ChatMarkdown safety (no HTML injection)", () => {
  const attacks = [
    '<img src=x onerror="alert(1)">',
    "<script>alert('xss')</script>",
    '<a href="javascript:alert(1)">click</a>',
    '**<b onmouseover="alert(1)">bold</b>**',
    "[click me](javascript:alert(1))",
    '<iframe src="https://evil.example"></iframe>',
  ];

  test.each(attacks)("%s is rendered as inert text, creating no HTML elements", (attack) => {
    const c = html(attack);
    expect(c.querySelector("img, script, a, iframe, b, style")).toBeNull();
    expect(c.querySelectorAll("[onerror], [onmouseover], [href], [src]").length).toBe(0);
    expect(c.textContent).toContain(attack.replace(/\*\*/g, ""));
  });

  test("never builds links from message text", () => {
    expect(html("Visit https://example.com or [x](https://example.com)").querySelector("a")).toBeNull();
  });
});

describe("in the chat widget", () => {
  test("a bot reply with markdown is rendered, not shown raw", async () => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    localStorage.setItem("client_token", "T");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ reply: "You have **2 invoices**:\n- INV-1 (paid)\n- INV-2 (sent)" }),
    });
    const { container } = render(<ClientChatWidget clientData={{ client: { name: "Jane" }, summary: {}, projects: [], invoices: [] }} />);
    fireEvent.click(document.querySelector(".cw-fab"));
    fireEvent.change(screen.getByPlaceholderText(/ask about your project/i), { target: { value: "invoices?" } });
    fireEvent.click(document.querySelector(".cw-send-btn"));
    const strong = await screen.findByText("2 invoices");
    expect(strong.tagName).toBe("STRONG");
    expect(container.querySelectorAll(".cw-msg.bot ul li").length).toBe(2);
    expect(container.textContent).not.toContain("**");
  });
});
