import { RequireLogin } from "@/components/RequireLogin";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireLogin>{children}</RequireLogin>;
}
