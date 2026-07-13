import { redirect } from "next/navigation";

export default function AdminPage() {
  // Redirect to doctors list by default
  redirect("/admin/doctors");
}
