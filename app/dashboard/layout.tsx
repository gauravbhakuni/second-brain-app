import { ThemeProvider } from "@/components/theme-provider";
import "./dashboard.css";
import Providers from "@/components/ProgressBarProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-layout min-h-screen">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Providers>{children}</Providers>
      </ThemeProvider>
    </div>
  );
}
