import SignIn from "@/components/SignIn";
import { HomePageView } from "@/components/home-page-view";

export default function Home() {
  return <HomePageView signIn={<SignIn />} />;
}
