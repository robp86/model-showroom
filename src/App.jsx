import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";

import Seo from "./components/Seo";
import HomePage from "./pages/HomePage";
import ShowroomPage from "./pages/ShowroomPage";
import AvailableHomesPage from "./pages/AvailableHomesPage";
import FloorPlansPage from "./pages/FloorPlansPage";
import CategoryPage from "./pages/CategoryPage";
import SeriesIndexPage from "./pages/SeriesIndexPage";
import SeriesPage from "./pages/SeriesPage";
import ModelPage from "./pages/ModelPage";
import FinderPage from "./pages/FinderPage";
import FinancingPage from "./pages/FinancingPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AuditPage from "./pages/AuditPage";

function NotFound() {
  return (
    <div className="container section center">
      <Seo title="Page not found" description="" noindex />
      <h1>Page not found</h1>
      <p className="muted">Let's get you back home.</p>
      <Link className="btn btn--primary" to="/">
        Back to Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/find" element={<FinderPage />} />
          <Route path="/available" element={<AvailableHomesPage />} />
          <Route path="/homes" element={<ShowroomPage />} />
          <Route path="/models" element={<ShowroomPage />} />
          <Route path="/floor-plans" element={<FloorPlansPage />} />
          <Route path="/series" element={<SeriesIndexPage />} />
          <Route path="/series/:slug" element={<SeriesPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/model/:id" element={<ModelPage />} />
          <Route path="/financing" element={<FinancingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
