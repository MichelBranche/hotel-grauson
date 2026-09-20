import { redirect } from "next/navigation";

import { getSession } from "@pms-core/auth/guards";
import LoginPage from "@pms-core/app/login/page";

export default async function Page() {
  const session = await getSession();
  if (session) redirect("/pms/planning");
  return <LoginPage />;
}
