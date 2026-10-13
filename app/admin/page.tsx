import type { Metadata } from "next";
import { Admin } from "./Admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="wrap">
      <Admin />
    </main>
  );
}
