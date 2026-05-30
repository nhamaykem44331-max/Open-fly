import { redirect } from "next/navigation";

// Tạm thời điều hướng tới trang showcase design-system trong khi dựng nền (P1.0).
// Sẽ thay bằng cổng đăng nhập / dashboard khi auth admin hoàn tất (P1.2).
export default function Home() {
  redirect("/dev/kitchen");
}
