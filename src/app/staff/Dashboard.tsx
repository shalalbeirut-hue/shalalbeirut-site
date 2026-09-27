import { api, kd, fmtDateTime } from '../lib';
import { useLoad, Loading, ErrorBox, Stars, Icon } from '../ui';

export function Dashboard() {
  const { data, error, loading } = useLoad(() => api('/dashboard'));
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const c = data.counts;
  const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
  const avg = (v: number | null) => (v == null ? '—' : v.toFixed(1));
  return (
    <div>
      <div class="page-head"><h1>لوحة التحكم</h1><a class="btn primary" href="/app/orders/new/"><Icon name="plus" />طلب جديد</a></div>
      <div class="stats">
        <a class={`stat ${c.new_count ? 'alert' : ''}`} href="/app/orders/"><div class="v">{c.new_count ?? 0}</div><div class="l">طلبات جديدة ما انسندت</div></a>
        <a class={`stat ${c.reopened ? 'alert' : ''}`} href="/app/orders/"><div class="v">{c.reopened ?? 0}</div><div class="l">طلبات أعيد فتحها</div></a>
        <a class={`stat ${c.late ? 'alert' : ''}`} href="/app/orders/"><div class="v">{c.late ?? 0}</div><div class="l">متأخرة عن موعدها</div></a>
        <div class="stat"><div class="v">{c.scheduled ?? 0}</div><div class="l">مسندة وبانتظار الزيارة</div></div>
        <div class="stat"><div class="v">{c.in_progress ?? 0}</div><div class="l">جاري الشغل الحين</div></div>
        <a class={`stat ${c.followups_due ? 'alert' : ''}`} href="/app/followups/"><div class="v">{c.followups_due ?? 0}</div><div class="l">متابعات مستحقة</div></a>
        <div class="stat"><div class="v">{c.done_30d ?? 0}</div><div class="l">زيارات خلصت (30 يوم)</div></div>
        <div class="stat"><div class="v num" style="font-size:1.2rem">{kd(c.revenue_30d_fils)}</div><div class="l">فواتير آخر 30 يوم</div></div>
        <a class="stat" href="/app/invoices/"><div class="v num" style="font-size:1.2rem">{kd(c.unpaid_fils)}</div><div class="l">مبالغ غير محصّلة</div></a>
        <div class="stat"><div class="v">{c.active_warranties ?? 0}</div><div class="l">كفالات سارية</div></div>
        <a class="stat" href="/app/invoices/"><div class="v">{c.open_quotes ?? 0}</div><div class="l">عروض أسعار تنتظر توقيع</div></a>
        <a class="stat" href="/app/invoices/"><div class="v">{c.work_orders ?? 0}</div><div class="l">أوامر عمل موقّعة</div></a>
      </div>

      <div class="card">
        <h2>أداء الفنيين (آخر 30 يوم)</h2>
        {data.techs.length === 0 ? <p class="muted">ما في فنيين مسجّلين. <a href="/app/team/">أضف فني</a></p> : (
          <div class="table-wrap"><table>
            <thead><tr><th>الفني</th><th>زيارات خلصت</th><th>مفتوحة الحين</th><th>تقييم الخدمة</th><th>تقييم الالتزام</th><th>بدأ بالوقت</th></tr></thead>
            <tbody>{data.techs.map((t: any) => (
              <tr><td>{t.name}</td><td class="num">{t.visits}</td><td class="num">{t.open}</td><td class="num">{avg(t.rating)}</td><td class="num">{avg(t.punctuality)}</td><td class="num">{pct(t.on_time)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <div class="card">
        <h2>تقييمات منخفضة (آخر 30 يوم)</h2>
        {data.low_ratings.length === 0 ? <p class="muted">ما في تقييمات منخفضة. زين!</p> : (
          <div class="list">{data.low_ratings.map((r: any) => (
            <a class="item" href={`/app/orders/${r.order_id}/`}>
              <div class="top"><span class="title">{r.customer_name} · <span class="num">{r.code}</span></span><Stars n={r.rating_overall} /></div>
              {r.comment && <p>{r.comment}</p>}
              <span class="small muted">{fmtDateTime(r.submitted_at)}</span>
            </a>
          ))}</div>
        )}
      </div>
    </div>
  );
}
