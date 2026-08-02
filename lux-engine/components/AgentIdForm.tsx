"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

type Step = "enter" | "verifying" | "confirm" | "syncing" | "done" | "error";

interface VerifiedListing {
  listingId: string;
  address: string;
  city: string;
  state: string;
  price: number;
  image: string | null;
  agentName: string;
}

export default function AgentIdForm() {
  const [step, setStep] = useState<Step>("enter");
  const [agentId, setAgentId] = useState("");
  const [mlsName, setMlsName] = useState("ARMLS");
  const [verified, setVerified] = useState<VerifiedListing | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const updateAgentId = useMutation(api.users.updateAgentId);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const verifyAgent = useAction(api.listings.verifyAgent);
  const syncListings = useAction(api.listings.syncListings);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId.trim()) return;

    setStep("verifying");
    setErrorMsg("");

    try {
      const result = await verifyAgent({ agentId: agentId.trim(), mlsName });

      if (!result) {
        setErrorMsg(
          `No active listings found for Agent ID "${agentId}" in ${mlsName}. Double-check the ID and MLS name.`,
        );
        setStep("error");
        return;
      }

      setVerified(result);
      setStep("confirm");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      if (msg === "NO_KEY") {
        // No IDX key yet — skip straight to onboarding with manual confirmation
        setStep("confirm");
        setVerified(null);
      } else {
        setErrorMsg(msg);
        setStep("error");
      }
    }
  }

  async function handleConfirm() {
    setStep("syncing");
    try {
      await updateAgentId({ agentId: agentId.trim(), mlsName });

      try {
        await syncListings({ agentId: agentId.trim(), mlsName });
      } catch {
        // Sync may fail if IDX key isn't set yet — that's OK, agent ID is saved
      }

      await completeOnboarding();
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Setup failed");
      setStep("error");
    }
  }

  function handleRetry() {
    setStep("enter");
    setVerified(null);
    setErrorMsg("");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex gap-2 mb-10 justify-center">
          {(["enter", "confirm", "done"] as const).map((s, i) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                (step === "enter" && i === 0) ||
                (step === "verifying" && i === 0) ||
                ((step === "confirm" || step === "syncing") && i === 1) ||
                (step === "done" && i === 2)
                  ? "bg-sulfur"
                  : "bg-gunmetal/40"
              }`}
            />
          ))}
        </div>

        {/* Step: Enter Agent ID */}
        {(step === "enter" || step === "verifying") && (
          <form onSubmit={handleVerify} className="flex flex-col gap-6">
            <div>
              <p className="text-gunmetal tracking-widest uppercase text-xs mb-3">
                Step 1 of 2
              </p>
              <h2 className="text-3xl font-extralight text-white tracking-wide">
                Unlock your inventory.
              </h2>
              <p className="text-gunmetal text-sm mt-2 leading-relaxed">
                Enter your MLS Agent ID to connect your active listings to Lux
                Engine. No IDX subscription required.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="agent-id"
                  className="text-gunmetal text-xs tracking-widest uppercase block mb-2"
                >
                  MLS Agent ID
                </label>
                <input
                  id="agent-id"
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="e.g. SA654321"
                  required
                  className="w-full bg-surface border border-gunmetal text-white px-4 py-3 text-sm focus:outline-none focus:border-sulfur transition-colors placeholder:text-gunmetal"
                />
              </div>

              <div>
                <label
                  htmlFor="mls-name"
                  className="text-gunmetal text-xs tracking-widest uppercase block mb-2"
                >
                  MLS Name
                </label>
                <select
                  id="mls-name"
                  value={mlsName}
                  onChange={(e) => setMlsName(e.target.value)}
                  className="w-full bg-surface border border-gunmetal text-white px-4 py-3 text-sm focus:outline-none focus:border-sulfur transition-colors appearance-none cursor-pointer"
                >
                  <option value="ARMLS">ARMLS (Arizona)</option>
                  <option value="CRMLS">CRMLS (California)</option>
                  <option value="NTREIS">NTREIS (Texas)</option>
                  <option value="FMLS">FMLS (Georgia)</option>
                  <option value="MRED">MRED (Illinois)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={step === "verifying" || !agentId.trim()}
              className="bg-cinnabar text-white py-3 text-xs tracking-widest uppercase hover:brightness-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === "verifying" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Find My Listings →"
              )}
            </button>
          </form>
        )}

        {/* Step: Confirm identity */}
        {(step === "confirm" || step === "syncing") && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-gunmetal tracking-widest uppercase text-xs mb-3">
                Step 2 of 2
              </p>
              <h2 className="text-3xl font-extralight text-white tracking-wide">
                {verified ? "Is this your listing?" : "Confirm your details."}
              </h2>
              <p className="text-gunmetal text-sm mt-2">
                {verified
                  ? "We found this listing under your Agent ID. Confirm it's yours to import your full inventory."
                  : `We'll link Agent ID "${agentId}" to your account and import your listings when the data connection is available.`}
              </p>
            </div>

            {verified && (
              <div className="border border-gunmetal overflow-hidden">
                {verified.image && (
                  <div className="relative h-40 bg-surface">
                    <img
                      src={verified.image}
                      alt={verified.address}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 to-transparent" />
                  </div>
                )}
                <div className="p-4 bg-surface">
                  <p className="text-white font-medium">{verified.address}</p>
                  <p className="text-gunmetal text-sm">
                    {verified.city}, {verified.state}
                  </p>
                  <p className="text-sulfur text-lg font-light mt-2">
                    ${verified.price.toLocaleString()}
                  </p>
                  {verified.agentName && (
                    <p className="text-gunmetal text-xs mt-1">
                      Agent: {verified.agentName}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={step === "syncing"}
                className="flex-1 bg-cinnabar text-white py-3 text-xs tracking-widest uppercase hover:brightness-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === "syncing" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    Importing...
                  </span>
                ) : verified ? (
                  "Yes, Import My Listings →"
                ) : (
                  "Confirm & Continue →"
                )}
              </button>
              {verified && (
                <button
                  onClick={handleRetry}
                  disabled={step === "syncing"}
                  className="border border-gunmetal text-gunmetal px-4 py-3 text-xs tracking-widest uppercase hover:border-white hover:text-white transition-colors duration-200 disabled:opacity-40"
                >
                  Not Mine
                </button>
              )}
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-12 h-12 border border-sulfur flex items-center justify-center">
              <span className="text-sulfur text-xl">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-extralight text-white tracking-wide">
                You&apos;re live.
              </h2>
              <p className="text-gunmetal text-sm mt-2">
                Your inventory is loading. Click{" "}
                <span className="text-sulfur">Launch Site</span> on any listing
                to generate a luxury property website.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col gap-6">
            <div className="border border-cinnabar/40 bg-cinnabar/5 p-4">
              <p className="text-cinnabar text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={handleRetry}
              className="border border-gunmetal text-gunmetal py-3 text-xs tracking-widest uppercase hover:border-white hover:text-white transition-colors duration-200"
            >
              ← Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
