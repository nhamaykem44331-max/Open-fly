import { NotificationContentService } from '../notification-content.service';

describe('NotificationContentService.render', () => {
  const svc = new NotificationContentService();

  it('HUNT_FOUND auto-hold: tiêu đề giữ chỗ + chào theo tên + giá + hạn', () => {
    const r = svc.render(
      'HUNT_FOUND',
      { autoHeld: true, route: 'HAN-SGN', price: 1_490_000, deadline: '2026-06-10T09:00:00.000Z' },
      { fullName: 'NGUYEN VAN AN' },
    );
    expect(r.title).toBe('OpenFly đã giữ chỗ cho bạn');
    expect(r.body).toContain('An ơi,');
    expect(r.body).toContain('HAN-SGN');
    expect(r.body).toContain('1.490.000đ');
    expect(r.ctaLabel).toBe('Thanh toán');
  });

  it('HUNT_FOUND manual: không user -> không chào, tiêu đề tìm thấy vé', () => {
    const r = svc.render('HUNT_FOUND', { autoHeld: false, route: 'SGN-DAD', price: 800_000 }, null);
    expect(r.title).toBe('Tìm thấy vé đúng giá');
    expect(r.body.startsWith('đã có vé')).toBe(true);
    expect(r.body).toContain('800.000đ');
  });

  it('HUNT_PROGRESS: tiêu đề giá đang giảm', () => {
    const r = svc.render('HUNT_PROGRESS', { route: 'HAN-SGN', price: 1_200_000 }, null);
    expect(r.title).toBe('Giá đang giảm');
    expect(r.body).toContain('1.200.000đ');
  });

  it('SYSTEM: dùng title/body trong payload', () => {
    const r = svc.render('SYSTEM', { title: 'Đã tạm dừng săn vé', body: 'Lý do X' }, null);
    expect(r.title).toBe('Đã tạm dừng săn vé');
    expect(r.body).toContain('Lý do X');
  });
});
