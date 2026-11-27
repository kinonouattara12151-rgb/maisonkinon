import { Routes, Route } from "react-router-dom";
import { AuthProvider }     from "./context/AuthContext";
import { ProductsProvider } from "./context/ProductsContext";
import { StoreProvider }    from "./context/StoreContext";
import CookieBanner         from "./components/CookieBanner";

import ShopPage          from "./pages/ShopPage";
import AdminPage         from "./pages/AdminPage";
import LoginPage         from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage       from "./pages/PrivacyPage";
import TermsPage         from "./pages/TermsPage";
import CookiesPage       from "./pages/CookiesPage";
import LegalPage         from "./pages/LegalPage";
import HelpPage          from "./pages/HelpPage";
import NotFoundPage      from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <StoreProvider>
        <Routes>
        {/* Boutique */}
        <Route path="/"               element={<ShopPage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin — accès direct par URL uniquement */}
        <Route path="/admin"     element={<AdminPage />} />
        <Route path="/dashboard" element={<AdminPage />} />

        {/* Pages légales */}
        <Route path="/confidentialite"  element={<PrivacyPage />} />
        <Route path="/cgu"              element={<TermsPage />} />
        <Route path="/cookies"          element={<CookiesPage />} />
        <Route path="/mentions-legales" element={<LegalPage />} />

        {/* Centre d'aide */}
        <Route path="/aide" element={<HelpPage />} />

        {/* 404 — toute URL non reconnue */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Bandeau consentement — affiché sur toutes les pages */}
      <CookieBanner />
      </StoreProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
