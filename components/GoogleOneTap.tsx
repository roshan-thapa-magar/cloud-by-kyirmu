"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

export default function GoogleOneTap() {
  const { status } = useSession();

  useEffect(() => {
    // Only show One Tap if user is NOT authenticated
    if (status === "authenticated") return;

    const clientId = "1097026912711-orn0osuht03f43a7j13fsfebl2qv04c1.apps.googleusercontent.com";
    if (!clientId) {
      console.error("Missing GOOGLE_CLIENT_ID!");
      return;
    }

    // Load Google Identity Services script
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (document.getElementById("google-identity-script")) {
          resolve(); // already loaded
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.id = "google-identity-script";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject("Failed to load Google script");
        document.body.appendChild(script);
      });
    };

    const handleCredentialResponse = async (response: any) => {
      await signIn("google", { id_token: response.credential, redirect: true });
    };

    const initGoogleOneTap = async () => {
      try {
        await loadScript();

        // @ts-ignore
        if (!window.google?.accounts?.id) {
          console.error("Google Identity Services not loaded!");
          return;
        }

        // Initialize with client ID
        // @ts-ignore
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        // Only call prompt after initialize
        // @ts-ignore
        google.accounts.id.prompt();
      } catch (err) {
        console.error(err);
      }
    };

    initGoogleOneTap();
  }, [status]); // <-- watch status so it reacts when session changes

  return null;
}
