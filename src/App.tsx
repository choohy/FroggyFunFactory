import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Nav from "@/components/Nav";
import Dashboard from "@/pages/Dashboard";
import VenuesList from "@/pages/venues/VenuesList";
import VenueDetail from "@/pages/venues/VenueDetail";
import VenueNew from "@/pages/venues/VenueNew";
import VenueEdit from "@/pages/venues/VenueEdit";
import VendorsList from "@/pages/vendors/VendorsList";
import VendorDetail from "@/pages/vendors/VendorDetail";
import VendorNew from "@/pages/vendors/VendorNew";
import VendorEdit from "@/pages/vendors/VendorEdit";
import ContactsList from "@/pages/contacts/ContactsList";
import ContactDetail from "@/pages/contacts/ContactDetail";
import ContactNew from "@/pages/contacts/ContactNew";
import ContactEdit from "@/pages/contacts/ContactEdit";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <Nav />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />

              <Route path="/venues" element={<VenuesList />} />
              <Route path="/venues/new" element={<VenueNew />} />
              <Route path="/venues/:id" element={<VenueDetail />} />
              <Route path="/venues/:id/edit" element={<VenueEdit />} />

              <Route path="/vendors" element={<VendorsList />} />
              <Route path="/vendors/new" element={<VendorNew />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/vendors/:id/edit" element={<VendorEdit />} />

              <Route path="/contacts" element={<ContactsList />} />
              <Route path="/contacts/new" element={<ContactNew />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
              <Route path="/contacts/:id/edit" element={<ContactEdit />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
