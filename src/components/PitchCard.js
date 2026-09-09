"use client";
import { useState } from "react";

export default function PitchCard({ brand }) {
  // 0: Pitch, 1: Drafting/Initial, 2: Negotiation, 3: Contract, 4: Terminated
  const [step, setStep] = useState(0);
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [proposalText, setProposalText] = useState("");
  const [producerAsk, setProducerAsk] = useState(brand.min_placement_budget);
  
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState(null);
  const [contractStream, setContractStream] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [submitCount, setSubmitCount] = useState(0);
  const [lastCounterOffer, setLastCounterOffer] = useState(null);
  const [dealRejected, setDealRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  const maxProps = brand.max_proposals || 3;

  const handleEnterDealRoom = async () => {
    setStep(1);
    setIsDrafting(true);
    
    try {
      const response = await fetch('/api/draftProposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brand.brand_name, category: brand.category })
      });
      const data = await response.json();
      if (data.success) {
        setProposalText(data.data);
      } else {
        setProposalText(`AI Agent Error: ${data.error}. Please write manually.`);
      }
    } catch (error) {
      console.error("Drafting failed", error);
      setProposalText("Integration proposal draft failed. Please write manually.");
    } finally {
      setIsDrafting(false);
    }
  };

  const startContractStreaming = async () => {
    setIsStreaming(true);
    setContractStream("");
    
    try {
      const response = await fetch('/api/draftContract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brand.brand_name,
          askAmount: Number(producerAsk),
          proposalText
        })
      });

      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setContractStream(prev => prev + chunk);
        }
      }
    } catch (error) {
      console.error("Stream failed", error);
      setContractStream("Error generating Term Sheet. Please retry.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNegotiate = async () => {
    if (Number(producerAsk) > brand.max_budget) {
      setValidationError(`Ask exceeds Remaining Budget of $${brand.max_budget.toLocaleString()}`);
      return;
    }
    setValidationError("");
    
    setIsNegotiating(true);
    setNegotiationResult(null);
    setSubmitCount(prev => prev + 1);

    try {
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          producerAsk: Number(producerAsk),
          proposalText,
          lastCounterOffer
        })
      });
      const data = await response.json();
      if (data.success) {
        setNegotiationResult(data.data);
        if (data.data.status === 'COUNTER' && data.data.counterOffer) {
          setLastCounterOffer(data.data.counterOffer);
        }
        
        if (data.data.status === 'ACCEPT') {
           setStep(3);
           startContractStreaming();
        } else {
           setStep(2);
        }
      } else {
        setNegotiationResult({ status: 'REJECT', message: `Server Error: ${data.error}` });
        setStep(2);
      }
    } catch (error) {
      console.error("Negotiation failed", error);
      setStep(2);
    } finally {
      setIsNegotiating(false);
    }
  };

  const isLockedOut = submitCount >= maxProps;
  const isInputDisabled = isDrafting || isNegotiating || isLockedOut;

  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: '1px solid',
      borderColor: step === 4 ? (dealRejected ? '#FF4B4B' : '#00FF9D') : 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '2rem',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.3s ease',
      minHeight: '400px'
    }} className="animate-in">
      
      {/* STEP 0: INITIAL PITCH */}
      {step === 0 && (
        <div className="animate-in">
          <div style={{ width: '100%', height: brand.imageOrientation === 'portrait' ? '450px' : '250px', backgroundImage: `url(${brand.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Confidence: 98%
            </div>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                  {brand.category}
                </span>
                <h3 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{brand.brand_name}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                    Total Annual Budget
                  </span>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    ${(brand.max_budget * 25).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                    Remaining Allocation
                  </span>
                  <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-body)', fontWeight: '300', color: '#00FF9D' }}>
                    ${brand.max_budget.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              {brand.pitch}
            </p>
            <button className="sq-btn sq-btn-outline" style={{ width: '100%', fontSize: '0.85rem' }} onClick={handleEnterDealRoom}>
              Enter Deal Room
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 & 2: DRAFTING AND NEGOTIATION */}
      {(step === 1 || step === 2) && (
        <div className="animate-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{brand.brand_name}</h3>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agentic Deal Room</span>
             </div>
             <div style={{ textAlign: 'right', display: 'flex', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Remaining Budget</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00FF9D' }}>
                    ${brand.max_budget.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Attempts</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isLockedOut ? '#FF4B4B' : 'var(--text-primary)' }}>
                    {maxProps - submitCount}
                  </div>
                </div>
             </div>
          </div>
          
          {step === 2 && negotiationResult && (
            <div style={{ 
              padding: '1.5rem', 
              borderRadius: '4px', 
              border: '1px solid',
              borderColor: negotiationResult.status === 'COUNTER' ? '#FFD700' : '#FF4B4B',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: '1.5rem'
            }} className="animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ 
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: negotiationResult.status === 'COUNTER' ? '#FFD700' : '#FF4B4B'
                }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                  Brand Manager AI • {negotiationResult.status}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }} 
                dangerouslySetInnerHTML={{ __html: `"${negotiationResult.message}"` }}
              />
              {negotiationResult.status === 'COUNTER' && negotiationResult.counterOffer && (
                <p style={{ marginTop: '0.75rem', fontSize: '1.2rem', fontWeight: '500', color: '#FFD700' }}>
                  Counter Offer: ${negotiationResult.counterOffer.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {isDrafting ? (
            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>PRODUCER AGENT DRAFTING...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Creative Integration Terms</label>
                <div 
                  data-lenis-prevent="true"
                  contentEditable={!isInputDisabled}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setProposalText(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: proposalText }}
                  style={{
                    width: '100%',
                    height: '250px',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-body)',
                    overflowY: 'auto',
                    lineHeight: '1.8',
                    fontSize: '0.9rem',
                    opacity: isInputDisabled ? 0.5 : 1,
                    whiteSpace: 'pre-wrap'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Asking Price ($)</label>
                  <input 
                    type="number" 
                    value={producerAsk}
                    max={brand.max_budget}
                    onChange={(e) => {
                      setProducerAsk(e.target.value);
                      if (validationError) setValidationError("");
                    }}
                    disabled={isInputDisabled}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${validationError ? '#FF4B4B' : 'rgba(255,255,255,0.1)'}`,
                      color: validationError ? '#FF4B4B' : 'var(--text-primary)',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '1rem',
                      opacity: isInputDisabled ? 0.5 : 1
                    }}
                  />
                  {validationError && (
                    <span style={{ display: 'block', color: '#FF4B4B', fontSize: '0.75rem', marginTop: '0.5rem' }}>{validationError}</span>
                  )}
                </div>
                
                {isLockedOut ? (
                  <button className="sq-btn sq-btn-outline" style={{ alignSelf: 'flex-end', height: '54px', padding: '0 2rem', borderColor: '#FF4B4B', color: '#FF4B4B', opacity: 0.8 }} disabled>
                    Negotiation Closed
                  </button>
                ) : (
                  <button className="sq-btn" style={{ alignSelf: 'flex-end', height: '54px', padding: '0 2rem' }} onClick={handleNegotiate} disabled={isNegotiating}>
                    {isNegotiating ? "Negotiating..." : (step === 2 ? "Resubmit Counter" : "Submit Proposal")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CONTRACT REVIEW */}
      {step === 3 && negotiationResult && (
        <div className="animate-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF9D' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em', color: '#00FF9D' }}>
              Brand Manager AI • ACCEPT
            </span>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '2rem' }}>
            "{negotiationResult.message}"
          </p>

          <div 
            data-lenis-prevent="true" 
            style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '1.5rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
            <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1.5rem', letterSpacing: '0.1em', textAlign: 'center' }}>
              Term Sheet / Memorandum of Understanding
            </h5>
            <div 
              style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: contractStream + (isStreaming ? "<span class='cursor-blink'>█</span>" : "") }}
            />
          </div>

          {!showRejectInput ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="sq-btn sq-btn-outline" style={{ flex: 1, borderColor: '#FF4B4B', color: '#FF4B4B' }} onClick={() => setShowRejectInput(true)}>
                 Reject Deal
               </button>
               <button className="sq-btn" style={{ flex: 2, background: '#00FF9D', color: '#000', fontWeight: 'bold' }} onClick={() => setStep(4)}>
                 Sign & Close Deal
               </button>
            </div>
          ) : (
            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <input 
                 type="text" 
                 placeholder="Reason for walking away..."
                 value={rejectionReason}
                 onChange={(e) => setRejectionReason(e.target.value)}
                 style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #FF4B4B', color: 'var(--text-primary)', borderRadius: '4px' }}
               />
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className="sq-btn sq-btn-outline" style={{ flex: 1 }} onClick={() => setShowRejectInput(false)}>Cancel</button>
                 <button className="sq-btn" style={{ flex: 2, background: '#FF4B4B', color: '#FFF' }} onClick={() => { setDealRejected(true); setStep(4); }}>
                   Confirm Walk Away
                 </button>
               </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: TERMINAL STATE */}
      {step === 4 && (
        <div className="animate-in" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          {dealRejected ? (
            <div style={{ background: 'rgba(255, 75, 75, 0.05)', border: '1px solid rgba(255, 75, 75, 0.2)', borderRadius: '4px', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚪</div>
              <h3 style={{ color: '#FF4B4B', fontSize: '1.8rem', marginBottom: '1rem' }}>Producer Walked Away</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                You rejected the finalized agreement. The deal is dead.
              </p>
              {rejectionReason && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  "{rejectionReason}"
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'rgba(0, 255, 157, 0.05)', border: '1px solid rgba(0, 255, 157, 0.2)', borderRadius: '4px', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
              <h3 style={{ color: '#00FF9D', fontSize: '1.8rem', marginBottom: '1rem' }}>Deal Secured</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                Binding contract successfully signed via Agentic Proxy.
              </p>
              <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(0, 255, 157, 0.3)', borderRadius: '4px', display: 'inline-block' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Escrow Deduction</span>
                <strong style={{ color: 'white', fontSize: '1.5rem' }}>${parseInt(producerAsk).toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
