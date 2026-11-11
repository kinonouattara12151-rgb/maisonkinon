import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, requestReset } = useAuth();

  const [mode, setMode] = useState<Mode>("login");

  /* Champs connexion / inscription */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [consented, setConsented] = useState(false);

  /* Champ mot de passe oublié */
  const [resetEmail, setResetEmail]   = useState("");
  const [resetToken, setResetToken]   = useState<string | null>(null); // token généré
  const [resetDone, setResetDone]     = useState(false);

  /* États communs */
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ── Connexion / Inscription ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && !consented) {
      setError("Vous devez accepter la politique de confidentialité pour créer un compte.");
      return;
    }

    setLoading(true);
    const err =
      mode === "login"
        ? await login(email, password)
        : await register(firstName, lastName, email, password);
    setLoading(false);

    if (err) { setError(err); }
    else { navigate("/"); }
  };

  /* ── Demande de réinitialisation ── */
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = await requestReset(resetEmail);
    setLoading(false);
    // Que l'e-mail existe ou non, on affiche le même écran (anti-énumération)
    setResetToken(token);
    setResetDone(true);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setResetEmail("");
    setResetToken(null);
    setResetDone(false);
  };

  /* ── Rendu ── */
  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Barre du haut */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <a href="/" className="text-xl font-black tracking-tight text-foreground">
            MAISON KIN<span className="text-primary">O</span>N
          </a>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft size={14} />
            Retour à la boutique
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ════ VUE MOT DE PASSE OUBLIÉ ════ */}
          {mode === "forgot" && (
            <div className="border border-border bg-card p-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
              >
                <ArrowLeft size={13} />
                Retour à la connexion
              </button>

              <h1 className="mb-1 text-lg font-bold text-foreground">Mot de passe oublié</h1>
              <p className="mb-5 text-xs text-muted-foreground">
                Entrez votre adresse e-mail. Vous recevrez un lien de réinitialisation valable 30 minutes.
              </p>

              {!resetDone ? (
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reset-email" className="text-xs font-semibold text-foreground">
                      Adresse e-mail *
                    </label>
                    <input
                      id="reset-email"
                      required
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="kinouOuattara@gmail.com"
                      className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {error && (
                    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <><Mail size={15} /> Envoyer le lien de réinitialisation</>
                    )}
                  </button>
                </form>
              ) : (
                /* ── Confirmation + lien de réinitialisation ── */
                <div className="space-y-4">
                  <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-700">Demande enregistrée</p>
                    <p className="mt-1 text-xs text-emerald-600">
                      Si un compte existe pour <strong>{resetEmail}</strong>, un lien de réinitialisation
                      a été généré ci-dessous. En production, ce lien serait envoyé par e-mail.
                    </p>
                  </div>

                  {/* Lien affiché directement (simulation — remplacer par envoi e-mail en prod) */}
                  {resetToken && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">
                        Lien de réinitialisation (valable 30 min) :
                      </p>
                      <div className="flex items-center gap-2 rounded border border-border bg-secondary p-3">
                        <code className="flex-1 break-all text-[11px] text-muted-foreground">
                          /reset-password?token={resetToken}
                        </code>
                      </div>
                      <Link
                        to={`/reset-password?token=${resetToken}`}
                        className="flex w-full items-center justify-center gap-2 border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent"
                      >
                        <ArrowRight size={15} />
                        Accéder à la page de réinitialisation
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="w-full text-center text-xs text-muted-foreground underline hover:text-primary"
                  >
                    Retour à la connexion
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════ VUES CONNEXION / INSCRIPTION ════ */}
          {(mode === "login" || mode === "register") && (
            <>
              {/* Onglets */}
              <div className="mb-6 flex border border-border">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                    mode === "login"
                      ? "bg-primary text-white"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn size={15} />
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                    mode === "register"
                      ? "bg-primary text-white"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus size={15} />
                  Créer un compte
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-card p-6">
                <h1 className="text-lg font-bold text-foreground">
                  {mode === "login" ? "Bienvenue !" : "Créer votre compte"}
                </h1>

                {mode === "register" && (
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground">Prénom *</label>
                      <input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Kinon"
                        className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground">Nom *</label>
                      <input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ouattara"
                        className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Adresse e-mail *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kinouOuattara@gmail.com"
                    className="border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Mot de passe *
                      {mode === "register" && (
                        <span className="ml-1 font-normal text-muted-foreground">(6 caractères min.)</span>
                      )}
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Consentement RGPD */}
                {mode === "register" && (
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                      className="sr-only"
                      aria-required="true"
                    />
                    <span
                      className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 transition-colors ${
                        consented ? "border-primary bg-primary" : "border-gray-300"
                      }`}
                      aria-hidden="true"
                    >
                      {consented && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      J'accepte la{" "}
                      <Link
                        to="/confidentialite"
                        target="_blank"
                        className="font-semibold text-primary underline hover:no-underline"
                      >
                        politique de confidentialité
                      </Link>
                      . Je confirme avoir au moins 18 ans.{" "}
                      <span className="text-primary">*</span>
                    </span>
                  </label>
                )}

                {error && (
                  <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : mode === "login" ? (
                    <><LogIn size={15} /> Se connecter</>
                  ) : (
                    <><UserPlus size={15} /> Créer mon compte</>
                  )}
                </button>

                {mode === "login" && (
                  <p className="text-center text-xs text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="font-semibold text-primary underline hover:no-underline"
                    >
                      Créer un compte gratuitement
                    </button>
                  </p>
                )}

                {/* Lien mot de passe oublié — sous le bouton Se connecter */}
                {mode === "login" && (
                  <p className="text-center text-xs">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-muted-foreground underline hover:text-primary"
                    >
                      Mot de passe oublié ?
                    </button>
                  </p>
                )}
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
