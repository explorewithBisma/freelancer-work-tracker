import React from "react";
import "./landing.css";
import { FaEnvelope, FaFacebookF, FaGoogle } from "react-icons/fa";
import { Link } from "react-router-dom";
import LandingChatWidget from "./LandingChatWidget";
import Lottie from "lottie-react";
import heroAnim from "../assets/lottie/hero.json";
import whyAnim from "../assets/lottie/why.json";



export default function Landing() {
  const offers = [
    { title: "Project & Task Management", desc: "Organize, track, and manage multiple projects and tasks with deadlines and priorities." },
    { title: "Real-Time Time Tracking", desc: "Accurately record working hours using a live start/stop timer linked to each project." },
    { title: "Automatic Invoice Generation", desc: "Generate professional invoices automatically based on tracked time and project details." },
    { title: "Client Portal & Communication", desc: "Give clients real-time access to project progress with chatbot-based automated support." },
  ];

  const whyPoints = [
    { title: "Simple & Fast Workflow", desc: "Less clicks, more action. Built for speed from day one." },
    { title: "Secure Authentication", desc: "Token-based access with fully protected routes and sessions." },
    { title: "Professional Output", desc: "Invoices and tracking reports that look premium and client-ready." },
  ];

  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-left">
          <p className="lp-eyebrow">Freelancer Work Tracker</p>
          <h1>Manage Your Freelance Work<span className="lp-grad"> Smarter</span> and<span className="lp-grad"> Faster</span></h1>
          <p className="lp-sub">Track projects, log time, generate invoices, and collaborate with clients — all in one clean dashboard.</p>
          <div className="lp-tags">
            <span>Manage</span><span>Monitor</span><span>Automate</span><span>Collaborate</span>
          </div>
          <div className="lp-cta">
            <Link className="lp-btn" to="/register">Get Started</Link>
            <Link className="lp-btn-ghost" to="/login">Login</Link>
          </div>
        </div>
        <div className="lp-hero-right">
          <div className="lp-hero-card"><Lottie animationData={heroAnim} loop={true} /></div>
        </div>
      </section>

      <section className="lp-section">
        <h2>What We Offer</h2>
        <p className="lp-section-sub">A simple, professional system to manage freelance work end-to-end.</p>
        <div className="lp-grid">
          {offers.map((x) => (
            <div className="lp-card" key={x.title}>
              <h3>{x.title}</h3>
              <p>{x.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-why">
        <div className="lp-why-right">
          <div className="lp-why-card"><Lottie animationData={whyAnim} loop={true} /></div>
        </div>
        <div className="lp-why-left">
          <h2>Why Choose Us</h2>
          <p className="lp-section-sub">Built for freelancers who want clarity, speed, and control in daily work.</p>
          <div className="lp-why-points">
            {whyPoints.map((p) => (
              <div className="lp-why-point" key={p.title}>
                <div className="lp-why-accent" />
                <div>
                  <p className="lp-why-title">{p.title}</p>
                  <p className="lp-why-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-foot-brand">
            <div className="lp-foot-logo">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="11" fill="rgba(255,255,255,0.14)"/>
                <rect x="1" y="1" width="38" height="38" rx="10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none"/>
                <line x1="20" y1="10" x2="10" y2="30" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"/>
                <line x1="20" y1="10" x2="30" y2="30" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"/>
                <line x1="10" y1="30" x2="30" y2="30" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"/>
                <circle cx="20" cy="10" r="3.5" fill="white"/>
                <circle cx="10" cy="30" r="3.5" fill="white"/>
                <circle cx="30" cy="30" r="3.5" fill="white"/>
              </svg>
              <h3>FWT</h3>
            </div>
            <p className="lp-foot-tagline">Your all-in-one workspace for freelance success.</p>
          </div>
          <div className="lp-foot-col">
            <h4>Quick Links</h4>
            <Link to="/register" className="foot-link">Get Started</Link>
            <Link to="/login" className="foot-link">Login</Link>
          </div>
          <div className="lp-foot-col">
            <h4>Contact Us</h4>
            <a href="mailto:fwtapp860@gmail.com" className="foot-item"><FaEnvelope className="foot-icon" /> fwtapp860@gmail.com</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="foot-item"><FaFacebookF className="foot-icon" /> Facebook</a>
            <a href="https://accounts.google.com" target="_blank" rel="noreferrer" className="foot-item"><FaGoogle className="foot-icon" /> Google ID</a>
          </div>
          <div className="lp-foot-stats">
            <div className="lp-foot-stat"><span className="lp-foot-stat-num">100%</span><span className="lp-foot-stat-label">Free to use</span></div>
            <div className="lp-foot-stat"><span className="lp-foot-stat-num">3-in-1</span><span className="lp-foot-stat-label">Tracker · Invoicer · Portal</span></div>
            <div className="lp-foot-stat"><span className="lp-foot-stat-num">JWT</span><span className="lp-foot-stat-label">Secure auth</span></div>
          </div>
        </div>
        <div className="lp-foot-bottom">
          <p>© {new Date().getFullYear()} Freelancer Work Tracker. All rights reserved.</p>
        </div>
      </footer>

      <LandingChatWidget />
    </div>
  );
}