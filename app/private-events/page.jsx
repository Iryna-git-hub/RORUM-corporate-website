import { redirect } from "next/navigation";

export default function PrivateEventsRedirect() {
    redirect("/private-meetings");
}
