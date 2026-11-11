import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, WifiOff, Heart, ShoppingCart } from "lucide-react";
import { sendMessage as sendToAgent } from "../lib/chatAgent";
import { useProductsContext } from "../context/ProductsContext";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

import type { Product } from "../types";

/** Extrait les noms de produits en **gras** depuis un message de l'agent. */
function extractBoldProducts(text: string, catalog: Product[]): Product[] {
  const boldMatches = [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].toLowerCase());
  const found: Product[] = [];
  for (const p of catalog) {
    const shortName = p.name
      .replace(/\s*(Eau de Parfum|Eau de Toilette|Eau de Cologne|Extrait de Parfum)\s*$/i, "")
      .toLowerCase();
    if (
      boldMatches.some(
        (b) =>
          b.includes(shortName) ||
          shortName.includes(b) ||
          b.includes(p.brand.toLowerCase()),
      ) &&
      !found.find((f) => f.id === p.id)
    ) {
      found.push(p);
    }
  }
  return found.slice(0, 4); // max 4 suggestions par message
}

/** Carte produit compacte dans le chat avec boutons cœur et panier. */
function ChatProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (id: number) => void;
  onAddToCart: (product: Product) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 border border-border bg-background p-2">
      <img
        src={product.image}
        alt={product.name}
        className="h-12 w-12 flex-shrink-0 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-foreground">{product.name}</p>
        <p className="text-[10px] text-muted-foreground">{product.brand} · {product.volume}</p>
        <p className="text-[11px] font-bold text-primary">{product.price.toLocaleString("fr-FR")} FCFA
          {product.originalPrice && (
            <span className="ml-1 text-[10px] font-normal text-muted-foreground line-through">
              {product.originalPrice.toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-label={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={() => onToggleWishlist(product.id)}
          className={`flex h-7 w-7 items-center justify-center border transition-colors ${
            isWishlisted
              ? "border-primary bg-primary text-white"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          <Heart size={12} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label="Ajouter au panier"
          onClick={() => onAddToCart(product)}
          className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ShoppingCart size={12} />
        </button>
      </div>
    </div>
  );
}

function FormattedMessage({
  content,
  catalog,
  wishlist,
  onToggleWishlist,
  onAddToCart,
}: {
  content: string;
  catalog: Product[];
  wishlist: Set<number>;
  onToggleWishlist: (id: number) => void;
  onAddToCart: (product: Product) => void;
}) {
  const matchedProducts = extractBoldProducts(content, catalog);

  return (
    <div className="space-y-1">
      {content.split("\n").map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-xs leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part,
            )}
          </p>
        );
      })}
      {matchedProducts.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {matchedProducts.map((p) => (
            <ChatProductCard
              key={p.id}
              product={p}
              isWishlisted={wishlist.has(p.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIChatWidget() {
  const { user } = useAuth();
  const { products } = useProductsContext();
  const { wishlist, toggleWishlist } = useWishlist(user?.id);
  const { addToCart } = useCart(user?.id, products);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedLLM, setUsedLLM] = useState<boolean | null>(null);
  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || isSendingRef.current) return;
    isSendingRef.current = true;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    /* On construit l'historique complet (mémoire conversationnelle)
       en incluant le message courant, puis on appelle l'agent.
       sendMessage() tente d'abord le LLM (edge function) puis
       retombe sur le moteur déterministe local en cas d'échec. */
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content }) as const),
      { role: "user" as const, content: text },
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { reply, usedLLM: llm } = await sendToAgent(history);
      setUsedLLM(llm);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Je rencontre une difficulté technique. Réessayez dans quelques instants.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {open && (
        <>
          {/* Overlay opaque sur mobile pour fermer */}
          <div
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Fenêtre de chat
              Mobile  : plein écran, décollée du bas pour éviter le clavier
              Desktop : flottante 384px en bas à droite */}
          <div
            className="
              fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col
              border border-border bg-card shadow-xl
              sm:inset-x-auto sm:bottom-20 sm:right-4 sm:w-96 sm:max-h-[520px]
            "
            role="dialog"
            aria-label="Assistant catalogue MAISON KINON"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-white" aria-hidden="true" />
                <p className="text-xs font-bold text-white">Assistant KINON</p>
                {usedLLM === false && (
                  <span
                    title="Mode hors-ligne : l'IA générative est temporairement indisponible"
                    className="flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] text-white/80"
                  >
                    <WifiOff size={9} aria-hidden="true" />
                    local
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Fermer le chat"
                onClick={() => setOpen(false)}
                className="text-white/80 transition-colors hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages — flex-1 + overflow-y-auto pour remplir l'espace disponible */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Posez une question sur notre catalogue (famille olfactive, genre, budget, promos...).
                </p>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center border border-border ${
                      msg.role === "assistant" ? "bg-primary text-white" : "bg-secondary text-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {msg.role === "assistant" ? <Bot size={12} /> : <User size={12} />}
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 text-xs ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "border border-border bg-background text-foreground"
                    }`}
                  >
                    <FormattedMessage
                      content={msg.content}
                      catalog={msg.role === "assistant" ? products : []}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={addToCart}
                    />
                    <p className={`mt-1 text-[9px] ${msg.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                      {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {/* Indicateur de saisie (agent réfléchit) */}
              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center border border-border bg-primary text-white" aria-hidden="true">
                    <Bot size={12} />
                  </div>
                  <div className="flex items-center gap-1 border border-border bg-background px-3 py-2.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="flex flex-shrink-0 items-center gap-2 border-t border-border p-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Votre question..."
                className="flex-1 border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50 sm:py-2 sm:text-xs"
                aria-label="Votre message"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                aria-label="Envoyer"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-primary text-white transition-colors hover:bg-red-700 disabled:opacity-40 sm:h-8 sm:w-8"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant */}
      <button
        type="button"
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant catalogue"}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center bg-primary text-white shadow-lg transition-colors hover:bg-red-700"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  );
}
