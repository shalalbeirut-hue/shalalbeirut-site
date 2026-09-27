// The printable document (quote, work order, invoice, paid invoice). Same markup on screen, in print and in PDF/image export.
import { fmtDate, kd, PAY, PAY_METHOD } from '../lib';
import { Mark } from '../ui';
import { SITE } from '../../config';

export const DOC_TITLE: Record<string, string> = { quote: 'عرض سعر', work_order: 'أمر عمل', invoice: 'فاتورة', paid: 'فاتورة مسددة' };
const KIND: Record<string, string> = { labour: 'مصنعية', part: 'قطعة غيار', other: 'أخرى' };

export function DocSheet({ doc, forExport }: { doc: any; forExport?: 'pdf' | 'png' }) {
  const st: string = doc.doc_status;
  const isInvoice = st === 'invoice' || st === 'paid';
  const date = isInvoice ? doc.invoiced_at ?? doc.issued_at : doc.issued_at;
  const warrantyActive = doc.ends_at && new Date(doc.ends_at) > new Date();
  const contact = [SITE.phone && `هاتف ${SITE.phone}`, SITE.whatsapp && `واتساب ${SITE.whatsapp}`, 'shalalbeirut.com'].filter(Boolean).join('  ·  ');

  return (
    <article class={`sheet ${forExport ? 'export export-' + forExport : ''}`} dir="rtl" lang="ar">
      <header class="sh-band">
        <div class="sh-brand">
          <Mark pipe="#FFFFFF" water="#62C0EA" />
          <div>
            <div class="sh-name">شلال بيروت</div>
            <div class="sh-legal">{SITE.legalAr}</div>
            <div class="sh-legal">{SITE.shopAr}</div>
          </div>
        </div>
        <div class="sh-title">
          <div class="sh-doc">{DOC_TITLE[st] ?? 'فاتورة'}</div>
          <div class="sh-no">{doc.number}</div>
          <div class="sh-date">{fmtDate(date)}</div>
        </div>
      </header>
      <svg class="sh-wave" viewBox="0 0 800 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H800V8C700 20 600 22 500 14S300 0 200 8 60 22 0 12Z" fill="#0F2A1F" /><path d="M0 16C80 24 160 22 240 14S420 4 520 14 700 26 800 14" fill="none" stroke="#1B8CC4" stroke-width="3" /></svg>

      <section class="sh-info">
        <div class="sh-box">
          <div class="sh-label">العميل</div>
          <div class="sh-strong">{doc.customer_name}</div>
          {doc.area && <div>{doc.governorate} - {doc.area}</div>}
        </div>
        <div class="sh-box">
          <div class="sh-label">تفاصيل الطلب</div>
          <div>رقم الطلب: <b class="num">{doc.code}</b></div>
          {doc.service && <div>الخدمة: {doc.service}</div>}
          {doc.tech_name && <div>الفني: {doc.tech_name}</div>}
          {doc.quote_number && doc.quote_number !== doc.number && <div>عرض السعر: <span class="num">{doc.quote_number}</span></div>}
        </div>
      </section>

      <table class="sh-items">
        <thead><tr><th>#</th><th>البند</th><th>النوع</th><th class="c">الكمية</th><th class="e">سعر الوحدة</th><th class="e">المجموع</th></tr></thead>
        <tbody>
          {doc.items.map((x: any, n: number) => (
            <tr><td class="num">{n + 1}</td><td>{x.description}</td><td class="muted">{KIND[x.kind] ?? ''}</td><td class="c num">{x.qty}</td><td class="e num">{(x.unit_fils / 1000).toFixed(3)}</td><td class="e num">{(x.total_fils / 1000).toFixed(3)}</td></tr>
          ))}
        </tbody>
      </table>

      <section class="sh-bottom">
        <div class="sh-notes">
          {st === 'paid' && <div class="sh-paid">مسددة</div>}
          {st === 'quote' && (
            <ul>
              <li>العرض صالح لمدة 7 أيام من تاريخه.</li>
              <li>السعر يشمل الشغل والقطع المذكورة فوق فقط. أي شغل إضافي نعطيك عليه عرض جديد قبل ما نبدأ.</li>
              <li>القطع من محلنا أصلية وعليها كفالة المصنع.</li>
            </ul>
          )}
          {isInvoice && <div>حالة الدفع: <b>{PAY[doc.payment_status]}</b>{doc.payment_method ? ` (${PAY_METHOD[doc.payment_method]})` : ''}{doc.payment_status === 'partial' ? ` · المدفوع ${kd(doc.paid_fils)}` : ''}</div>}
          {doc.notes && <p>{doc.notes}</p>}
        </div>
        <div class="sh-totals">
          <div><span>المجموع</span><span class="num">{kd(doc.subtotal_fils)}</span></div>
          {doc.discount_fils > 0 && <div><span>خصم</span><span class="num">- {kd(doc.discount_fils)}</span></div>}
          <div class="grand"><span>الإجمالي</span><span class="num">{kd(doc.total_fils)}</span></div>
        </div>
      </section>

      <section class="sh-sign">
        <div class="sh-signbox">
          <div class="sh-label">موافقة العميل على العرض</div>
          {doc.signature ? <img src={doc.signature} alt="توقيع العميل" /> : <div class="sh-line" />}
          <div class="muted">{doc.signed_at ? `${doc.signed_name ?? ''} · ${fmtDate(doc.signed_at)}` : 'الاسم والتوقيع'}</div>
        </div>
        <div class="sh-signbox">
          <div class="sh-label">عن شلال بيروت</div>
          <div class="sh-line" />
          <div class="muted">{doc.tech_name ?? ''}</div>
        </div>
      </section>

      {isInvoice && doc.months ? (
        <section class="sh-warranty">
          <div class="seal">كفالة<br />{doc.months} شهر</div>
          <div>
            <b>{warrantyActive ? 'الكفالة سارية' : 'الكفالة انتهت'}</b> · من {fmtDate(doc.starts_at)} لين {fmtDate(doc.ends_at)}
            {doc.covers && <div>تشمل: {doc.covers}</div>}
            <div class="muted">إذا صار أي خلل في الشغل خلال الكفالة، طرّش لنا رقم الطلب على الواتساب ونجيك ببلاش.</div>
          </div>
        </section>
      ) : null}


      <footer class="sh-foot">
        <span>في الموعد.. وبالضمان</span>
        <span class="num">{contact}</span>
      </footer>
    </article>
  );
}
