import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, KeyRound, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [ready, setReady]         = useState(false);
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  /* Supabase envoie un lien avec un token dans le hash — il gère la session automatiquement */
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    /* Si déjà en session de récupération (rechargement de page) */
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); }
    else { setSuccess(true); setTimeout(() => navigate("/login"), 2000); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <a href="/" className="text-xl font-black tracking-tight text-foreground">
            MAISON KIN<span className="text-primary">O</span>N
          </a>
          <Link to="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
            <ArrowLeft size={14} />Retour à la connexion
          </Link>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {success ? (
            <div className="border border-border bg-card p-6 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
              <h1 className="mb-2 text-lg font-bold text-foreground">Mot de passe mis à jour</h1>
              <p className="text-sm text-muted-foreground">Redirection vers la connexion...</p>
            </div>
          ) : !ready ? (
            <div className="border border-border bg-card p-6 text-center">
              <XCircle size={40} className="mx-auto mb-3 text-red-400" />
              <h1 className="mb-2 text-lg font-bold text-foreground">Lien invalide ou expiré</h1>
              <p className="mb-5 text-sm text-muted-foreground">Ce lien de réinitialisation n'est plus valide.</p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Faire une nouvelle demande
              </Link>
            </div>
          ) : (
            <div className="border border-border bg-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-primary text-white">
                  <KeyRound size={18} />
                </div>
                <h1 className="text-lg font-bold text-foreground">Nouveau mot de passe</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="pwd" className="text-xs font-semibold text-foreground">
                    Nouveau mot de passe * <span className="font-normal text-muted-foreground">(6 min.)</span>
                  </label>
                  <div className="relative">
                    <input id="pwd" required type={showPwd ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
                      className="w-full border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:border-primary focus:outline-none" />
                    <button type="button" onClick={() => setShowPwd(v => !v)} aria-label="Afficher/masquer" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {[1,2,3].map(l => {
                        const s = password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1;
                        return <div key={l} className={`h-1 flex-1 ${l <= s ? s===1?"bg-red-400":s===2?"bg-amber-400":"bg-emerald-500" : "bg-gray-200"}`} />;
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="conf" className="text-xs font-semibold text-foreground">Confirmer *</label>
                  <div className="relative">
                    <input id="conf" required type={showConf ? "text" : "password"} value={confirm}
                      onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
                      className={`w-full border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none ${confirm && confirm !== password ? "border-red-300" : confirm && confirm === password ? "border-emerald-400" : "border-border focus:border-primary"}`} />
                    <button type="button" onClick={() => setShowConf(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && <p className="text-[11px] text-red-500">Les mots de passe ne correspondent pas.</p>}
                </div>

                {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

                <button type="submit" disabled={loading || (!!confirm && confirm !== password)}
                  className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><KeyRound size={15} />Enregistrer</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
