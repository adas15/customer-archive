import { useState } from 'react';
import { Dialog, Toast, ImageViewer } from 'antd-mobile';
import { useObjectUrl } from '../hooks/useObjectUrl.js';
import { deleteCustomer } from '../db/customers.js';

const PROGRESS = { todo: '待办理', doing: '办理中', done: '已完成' };
const STATUS_CLASS = { done: 'ok', doing: 'doing', todo: 'todo' };

function DetailImg({ id, label }) {
  const url = useObjectUrl(id);
  const [view, setView] = useState(false);
  if (!url) return <div className="empty">{label}·无</div>;
  return (
    <>
      <img src={url} alt={label} onClick={() => setView(true)} />
      <ImageViewer image={url} visible={view} onClose={() => setView(false)} />
    </>
  );
}

export default function CustomerDetail({ customer, onBack, onEdit, onDeleted }) {
  async function handleDelete() {
    const ok = await Dialog.confirm({ content: `确认删除「${customer.companyName}」？此操作不可恢复。` });
    if (!ok) return;
    await deleteCustomer(customer.id);
    Toast.show({ icon: 'success', content: '已删除' });
    onDeleted();
  }

  return (
    <>
      <div className="navbar">
        <div className="back" onClick={onBack}>‹ 返回</div>
        <div className="title">客户详情</div>
        <div className="act" style={{ color: 'var(--brand)' }} onClick={onEdit}>编辑</div>
      </div>

      <div className="content">
        {/* 公司信息 */}
        <div className="detail-sec">
          <h3>公司信息</h3>
          <div className="detail-row"><span className="k">公司名</span><span className="v">{customer.companyName || '—'}</span></div>
          <div className="field-label">营业执照</div>
          <div className="detail-imgs"><DetailImg id={customer.businessLicense} label="营业执照" /><div /></div>
        </div>

        {/* 法人信息 */}
        <div className="detail-sec">
          <h3>法人信息</h3>
          <div className="detail-row"><span className="k">法人姓名</span><span className="v">{customer.legalPersonName || '—'}</span></div>
          <div className="detail-row"><span className="k">法人电话</span><span className="v">{customer.legalPersonPhone || '—'}</span></div>
          <div className="field-label">半身照 / 身份证</div>
          <div className="detail-imgs">
            <DetailImg id={customer.legalPortrait} label="半身照" />
            <DetailImg id={customer.legalIdFront} label="身份证正面" />
          </div>
          <div className="detail-imgs" style={{ marginTop: 8 }}>
            <DetailImg id={customer.legalIdBack} label="身份证反面" />
            <div />
          </div>
        </div>

        {/* 股东信息 */}
        <div className="detail-sec">
          <h3>股东信息（{(customer.shareholders || []).length}）</h3>
          {(customer.shareholders || []).length === 0 && <div style={{ fontSize: 13, color: 'var(--text-3)' }}>暂无股东</div>}
          {(customer.shareholders || []).map((s, i) => (
            <div key={s.id || i} style={{ borderTop: i ? '1px dashed var(--border)' : 'none', paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
              <div className="detail-row"><span className="k">股东 {i + 1}</span><span className="v">{s.name || '—'} · {s.phone || '—'}</span></div>
              <div className="detail-imgs">
                <DetailImg id={s.idFront} label="身份证正面" />
                <DetailImg id={s.idBack} label="身份证反面" />
              </div>
            </div>
          ))}
        </div>

        {/* 订单信息 */}
        <div className="detail-sec">
          <h3>订单信息（{(customer.orders || []).length}）</h3>
          {(customer.orders || []).length === 0 && <div style={{ fontSize: 13, color: 'var(--text-3)' }}>暂无订单</div>}
          {(customer.orders || []).map((o, i) => (
            <div key={o.id || i} style={{ borderTop: i ? '1px dashed var(--border)' : 'none', paddingTop: i ? 10 : 0, marginTop: i ? 10 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{o.orderNo || '（无订单号）'}</span>
                <span className={`tag ${STATUS_CLASS[o.progress] || 'todo'}`}>{PROGRESS[o.progress] || '待办理'}</span>
              </div>
              {o.serviceContent && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{o.serviceContent}</div>}
            </div>
          ))}
        </div>

        <button
          onClick={handleDelete}
          style={{ width: '100%', padding: 12, marginTop: 4, border: 'none', borderRadius: 'var(--r-sm)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}
        >
          删除该客户
        </button>
      </div>
    </>
  );
}
