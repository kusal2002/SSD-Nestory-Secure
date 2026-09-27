import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const OidcCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOidcLogin } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (exchangeStarted.current) {
      return;
    }

    exchangeStarted.current = true;

    const code = searchParams.get("code");

    // Remove the temporary handoff code from the browser URL immediately.
    window.history.replaceState(
      {},
      document.title,
      "/auth/oidc/callback"
    );

    if (!code) {
      setError("The WSO2 login response is missing the authorization code.");
      return;
    }

    const finishLogin = async () => {
      try {
        const user = await completeOidcLogin(code);

        if (user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        if (user.role === "child") {
          navigate("/child/dashboard", { replace: true });
          return;
        }

        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("OIDC login completion failed");
        setError(
          "We could not complete your WSO2 sign in. Please return to the login page and try again."
        );
      }
    };

    finishLogin();
  }, [completeOidcLogin, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Sign in failed</h1>

          <p className="mt-2 text-gray-600">{error}</p>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Completing sign in...</h1>
        <p className="mt-2 text-gray-600">
          Please wait while we finish your WSO2 login.
        </p>
      </div>
    </div>
  );
};

export default OidcCallbackPage;