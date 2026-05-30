import { PageHead } from "@/components/PageHead";
import { ScreenStub } from "@/components/ScreenStub";

export default function DashboardPage() {
  return (
    <>
      <PageHead
        eyebrow="OpenFly · Bảng quản trị"
        title="Tổng quan"
        subtitle="Nhịp vận hành trong ngày — hàng đợi xuất vé, thanh toán chờ duyệt, và sức khỏe hệ thống."
      />
      <ScreenStub note="Thống kê tổng quan sẽ hiển thị tại đây (Giai đoạn 1 — đang dựng endpoint)." />
    </>
  );
}
