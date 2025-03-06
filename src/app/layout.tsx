import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local LLM Evaluator",
  description: "Evaluate and judge LLM responses using local models via Ollama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
