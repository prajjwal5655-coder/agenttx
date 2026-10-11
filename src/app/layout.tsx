import Link from "next/link";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-gray-800 text-white p-4">
          <nav className="max-w-6xl mx-auto flex gap-4">
            <Link href="/" className="hover:text-blue-300">AgentTTX</Link>
            <Link href="/blast-radius" className="hover:text-blue-300">Blast Radius</Link>
            <Link href="/sessions" className="hover:text-blue-300">Sessions</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
