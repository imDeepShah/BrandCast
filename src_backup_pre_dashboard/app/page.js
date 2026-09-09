"use client";

import { useState } from "react";
import PitchCard from "@/components/PitchCard";
import Scene3D from "@/components/Scene3D";
import { mockScripts } from "@/lib/mockData";

export default function Home() {
  const [scriptInput, setScriptInput] = useState(mockScripts[0].text);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [results, setResults] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);

  const handleAnalyze = async () => {
    if (!scriptInput) return;
    
    setIsAnalyzing(true);
    setResults(null);
    setAgentLogs([]);

    const logs = [
      { sender: "SYSTEM", text: "Initializing Gemini Enterprise Agent Platform..." },
      { sender: "The Director", text: "Parsing narrative arc and isolating focal objects..." },
      { sender: "The Scout", text: "Querying ClickHouse vector database for demographic alignment..." },
      { sender: "The Producer", text: "Drafts highly persuasive, personalized integration pitches..." },
      { sender: "The Exec", text: "Evaluates pitches, negotiates budgets, and signs contracts..." }
    ];

    for (let i = 0; i < logs.length; i++) {
      setTimeout(() => {
        setAgentLogs(prev => [...prev, logs[i]]);
        setActiveAgent(logs[i].sender);
      }, i * 1500); 
    }

    const totalAnimTime = logs.length * 1500;

    let apiData = null;
    let apiError = null;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptInput })
      });
      apiData = await response.json();
    } catch (error) {
      console.error("Analysis failed", error);
      apiError = error;
    }

    // Wait until the 3D agent sequence finishes before displaying results
    setTimeout(() => {
      if (apiError) {
        setAgentLogs(prev => [...prev, { sender: "SYSTEM ERROR", text: "Connection to Gemini interrupted. Please try again." }]);
      } else if (apiData && apiData.success) {
        setResults(apiData.data);
        // Automatically scroll to the results so the user sees the deal room
        setTimeout(() => {
          document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setAgentLogs(prev => [...prev, { sender: "SYSTEM ERROR", text: apiData?.error || "Unknown error occurred." }]);
      }
      setIsAnalyzing(false);
      setTimeout(() => setActiveAgent(null), 1500);
    }, totalAnimTime);
  };

  const scrollToDemo = () => {
    document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
    <Scene3D activeAgent={activeAgent} />
    <main className="main-wrapper awwwards-style">
      {/* Navigation */}
      <nav className="sq-nav animate-in">
        <div className="sq-logo">BrandCast</div>
        <div className="sq-nav-links">
          <a href="#crew">How it Works</a>
          <span onClick={scrollToDemo} style={{cursor:'pointer'}}>Platform</span>
          <a href="#dashboard">Analytics</a>
          <a href="#pricing">Pricing</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section animate-in delay-1">
        <div className="hero-content">
          <div className="badge minimalist-badge">POWERED BY GEMINI 1.5 PRO</div>
          <h1 className="title-mega">
            The Agentic <i>Deal Room</i> <br/>for Modern Cinema.
          </h1>
          <p className="text-body-large hero-sub">
            BrandCast uses autonomous AI agents to parse scripts, match with global brands via Vector RAG, and negotiate binding product placement contracts in real-time.
          </p>
          <div className="hero-cta-group">
            <button className="sq-btn primary-solid" onClick={scrollToDemo}>
              Launch Platform
            </button>
            <a href="#pricing" className="sq-btn sq-btn-text">View Pricing</a>
          </div>
        </div>
      </section>

      {/* MEET THE CREW SECTION */}
      <section id="crew" className="sq-container minimalist-section">
        <div className="section-header-left">
          <h2>Meet the <i>Crew</i></h2>
          <p>An orchestrated network of autonomous AI agents powering your deals.</p>
        </div>
        
        <div className="crew-list">
          <div className="crew-item animate-in delay-1">
            <div className="crew-number">01</div>
            <div className="crew-text">
              <h3 className="crew-title">The Director</h3>
              <span className="dash-label color-director">Supervisor Agent</span>
              <p className="crew-desc">Parses the screenplay and extracts the core narrative arc.</p>
            </div>
          </div>
          <hr className="minimalist-hr" />
          <div className="crew-item animate-in delay-2">
            <div className="crew-number">02</div>
            <div className="crew-text">
              <h3 className="crew-title">The Scout</h3>
              <span className="dash-label color-scout">Matchmaker Agent</span>
              <p className="crew-desc">Queries the Vector DB to find perfect brand matches.</p>
            </div>
          </div>
          <hr className="minimalist-hr" />
          <div className="crew-item animate-in delay-3">
            <div className="crew-number">03</div>
            <div className="crew-text">
              <h3 className="crew-title">The Producer</h3>
              <span className="dash-label color-producer">Pitch Agent</span>
              <p className="crew-desc">Drafts highly persuasive, personalized integration pitches.</p>
            </div>
          </div>
          <hr className="minimalist-hr" />
          <div className="crew-item animate-in delay-4">
            <div className="crew-number">04</div>
            <div className="crew-text">
              <h3 className="crew-title">The Exec</h3>
              <span className="dash-label color-exec">Brand Manager Agent</span>
              <p className="crew-desc">Evaluates pitches, negotiates budgets, and signs contracts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section id="demo" className="sq-container minimalist-section">
        <div className="section-header-left">
          <h2>Agentic <i>Platform</i></h2>
          <p>Paste a script excerpt. Watch autonomous agents construct your deals.</p>
        </div>
        
        <div className="demo-layout">
          {/* Left: Input Area */}
          <div className="input-column">
            <textarea 
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              className="minimalist-input"
            />
            <button 
              className="sq-btn primary-solid" 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              style={{ opacity: isAnalyzing ? 0.5 : 1, marginTop: '2rem' }}
            >
              {isAnalyzing ? "Processing..." : "Run Agentic Workflow"}
            </button>
          </div>

          {/* Right: Agent Trace & Results */}
          <div className="results-column">
            {(isAnalyzing || agentLogs.length > 0) && !results && (
              <div className="minimalist-terminal">
                <span className="terminal-header">Agent Trace Log</span>
                <hr className="minimalist-hr"/>
                {agentLogs.map((log, idx) => {
                  let colorClass = "sys-text";
                  if (log.sender === "The Director") colorClass = "color-director";
                  if (log.sender === "The Scout") colorClass = "color-scout";
                  if (log.sender === "The Producer") colorClass = "color-producer";
                  if (log.sender === "The Exec") colorClass = "color-exec";

                  return (
                    <div key={idx} className="animate-in terminal-line">
                      <span className={colorClass} style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{log.sender}:</span>
                      {log.text}
                    </div>
                  );
                })}
                {isAnalyzing && (
                  <div className="loading-state">
                    <div className="status-indicator"></div>
                    <span>Agents working in background...</span>
                  </div>
                )}
              </div>
            )}

            {results && (
              <div className="animate-in" id="opportunities">
                <h3 className="results-title">Matched <i>Opportunities</i></h3>
                {results.map((brand, idx) => (
                  <PitchCard key={idx} brand={brand} />
                ))}
              </div>
            )}

            {!isAnalyzing && !results && agentLogs.length === 0 && (
              <div className="empty-state-minimalist">
                <p>Awaiting Execution...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DASHBOARD SECTION */}
      <section id="dashboard" className="sq-container minimalist-section">
        <div className="section-header-left">
          <h2>Producer <i>Dashboard</i></h2>
          <p>Track historical ad metrics, escrow balances, and total deal volume.</p>
        </div>
        
        <div className="metrics-layout">
          <div className="metric-item">
            <span className="dash-label">Total Escrow Revenue</span>
            <h3 className="dash-value">$1,240,000</h3>
            <span className="dash-trend positive">+14% this month</span>
          </div>
          <div className="metric-item">
            <span className="dash-label">Active Contracts</span>
            <h3 className="dash-value">4</h3>
            <span className="dash-trend neutral">Across 3 Productions</span>
          </div>
          <div className="metric-item">
            <span className="dash-label">Agent Win Rate</span>
            <h3 className="dash-value">82%</h3>
            <span className="dash-trend positive">Above industry avg</span>
          </div>
        </div>

        <div className="recent-deals-minimalist">
          <h4 className="table-title">Recent Placements</h4>
          <table className="deal-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Production</th>
                <th>Status</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>AeroDyne Motors</td>
                <td>Neon Shadows (Feature)</td>
                <td><span className="tag tag-success">Signed</span></td>
                <td>$210,000</td>
              </tr>
              <tr>
                <td>Vanguard Tech</td>
                <td>Silicon Valley S3</td>
                <td><span className="tag tag-success">Signed</span></td>
                <td>$150,000</td>
              </tr>
              <tr>
                <td>Apex Energy</td>
                <td>The Climb (Doc)</td>
                <td><span className="tag tag-pending">Negotiating</span></td>
                <td>$85,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="sq-container minimalist-section">
        <div className="section-header-left">
          <h2>Monetization <i>Tiers</i></h2>
          <p>Scale your brand outreach with Agentic infrastructure.</p>
        </div>

        <div className="pricing-layout">
          <div className="price-item">
            <div className="tier-name">Indie Creator</div>
            <div className="tier-price">10%</div>
            <div className="tier-sub">Escrow fee per closed deal</div>
            <hr className="minimalist-hr"/>
            <ul className="price-features">
              <li>Up to 5 Agentic Proposals / month</li>
              <li>Standard Vector Matching</li>
              <li>Basic Contract Drafting</li>
            </ul>
            <button className="sq-btn sq-btn-text">Start Free</button>
          </div>

          <div className="price-item popular-item">
            <div className="tier-name">Studio Pro</div>
            <div className="tier-price">$4,999<span>/mo</span></div>
            <div className="tier-sub">Unlimited agentic outreach</div>
            <hr className="minimalist-hr"/>
            <ul className="price-features">
              <li>Unlimited Proposals</li>
              <li>Priority Vector Matching</li>
              <li>Custom LLM Prompting</li>
              <li>Dedicated Account Manager</li>
            </ul>
            <button className="sq-btn primary-solid">Upgrade Studio</button>
          </div>

          <div className="price-item">
            <div className="tier-name">Enterprise Hub</div>
            <div className="tier-price">Custom</div>
            <div className="tier-sub">For massive production houses</div>
            <hr className="minimalist-hr"/>
            <ul className="price-features">
              <li>On-Premise Model Hosting</li>
              <li>Custom Brand Knowledge Bases</li>
              <li>White-labeled Deal Rooms</li>
              <li>Legal Department API Integration</li>
            </ul>
            <button className="sq-btn sq-btn-text">Contact Sales</button>
          </div>
        </div>
      </section>
      
      <footer className="footer-minimalist">
        <p>© 2026 BrandCast. Built for the Google Gemini Agentic Hackathon.</p>
      </footer>
    </main>
    </>
  );
}
