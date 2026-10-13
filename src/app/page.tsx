import SignIn from "@/components/sign-in";
import { HomePageView } from "@/components/home-page-view";

export default function Home() {
  return <HomePageView signIn={<SignIn />} />;
}
