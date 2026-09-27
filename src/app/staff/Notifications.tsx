import { useEffect } from 'preact/hooks';
import { api, fmtDateTime } from '../lib';
import { useLoad, Loading, ErrorBox, Btn } from '../ui';
import { useApp } from './App';

export function Notifications() {
  const { refreshCounts, counts, user } = useApp();
  const { data, error, loading, reload } = useLoad(() => api('/notifications'));
  const markRead = async () => { await api('/notifications/read', { method: 'POST' }).catch(() => {}); refreshCounts(); reload(); };
  useEffect(() => { if (data?.unread) markRead(); }, [data?.unread]);
  return (
    <div>
      <div class="page-head"><h1>التنبيهات</h1><Btn icon="refresh" variant="ghost" onClick={reload}>تحديث</Btn></div>
      {user.role !== 'tech' && counts.followups_due > 0 && <a class="note" style="display:block;margin-bottom:12px" href="/app/followups/">عندك {counts.followups_due} متابعة مستحقة. افتح المتابعة ←</a>}
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : data.notifications.length === 0 ? <div class="empty">ما في تنبيهات.</div> : (
        <div class="list">{data.notifications.map((n: any) => (
          <a class="item" href={n.order_id ? `/app/orders/${n.order_id}/` : '#'} style={n.read_at ? '' : 'border-color:var(--sand)'}>
            <div class="top"><span>{n.message}</span>{!n.read_at && <span class="badge t-warn">جديد</span>}</div>
            <span class="small muted">{fmtDateTime(n.created_at)}</span>
          </a>
        ))}</div>
      )}
    </div>
  );
}
