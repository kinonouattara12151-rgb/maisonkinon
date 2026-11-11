import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Logo */}
      <p className="text-xs font-black tracking-[0.3em] text-muted-foreground">
        MAISON KIN<span className="text-primary">O</span>N
      </p>

      {/* Code d'erreur */}
      <h1 className="text-8xl font-black text-primary" aria-label="Erreur 404">
        404
      </h1>

      {/* Message */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          Cette page n'existe pas
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Le lien que vous avez suivi est peut-être incorrect ou la page a été
          déplacée.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Page précédente
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <Home size={15} aria-hidden="true" />
          Retour à la boutique
        </button>
      </div>
    </div>
  );
}
