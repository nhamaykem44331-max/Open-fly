import { PageHead } from "@/components/PageHead";
import { ScreenStub } from "@/components/ScreenStub";

export default function QueuePage() {
  return (
    <>
      <PageHead
        eyebrow="Vận hành vé"
        title="Hàng đợi xuất vé"
        subtitle="Booking đã thanh toán đang chờ xuất vé — copy nội dung gửi nhóm Zalo Nam Thanh, nhập số vé khi xuất xong."
      />
      <ScreenStub note="Bảng hàng đợi xuất vé sẽ hiển thị tại đây (Giai đoạn 1 — nối GET /admin/bookings)." />
    </>
  );
}
