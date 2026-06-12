import { auth } from "@/lib/auth";
import { Landing } from "@/features/marketing/landing";

export default async function HomePage() {
  const session = await auth();
  return <Landing signedIn={!!session?.user} />;
}
