import { BookShell } from "@/components/BookShell";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <BookShell>{children}</BookShell>;
}
