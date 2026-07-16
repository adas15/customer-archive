// 客户列表卡片
const PROGRESS = { todo: '待办理', doing: '办理中', done: '已完成' };

function overallStatus(orders = []) {
  if (!orders.length) return null;
  if (orders.some((o) => o.progress === 'doing')) return 'doing';
  if (orders.every((o) => o.progress === 'done')) return 'done';
  return 'todo';
}
const STATUS_CLASS = { done: 'ok', doing: 'doing', todo: 'todo' };

export default function CustomerCard({ customer, onClick }) {
  const st = overallStatus(customer.orders);
  const pending = (customer.orders || []).filter((o) => o.progress !== 'done').length;
  const phone = customer.legalPersonPhone
    ? customer.legalPersonPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    : '—';

  return (
    <div className="ccard" onClick={onClick}>
      <div className="top">
        <div>
          <div className="name">{customer.companyName || '（未命名公司）'}</div>
          <div className="sub">法人 · {customer.legalPersonName || '—'} · {phone}</div>
        </div>
        {st && <span className={`tag ${STATUS_CLASS[st]}`}>{PROGRESS[st]}</span>}
      </div>
      <div className="stats">
        <div><b>{(customer.shareholders || []).length}</b><span>股东</span></div>
        <div><b>{(customer.orders || []).length}</b><span>订单</span></div>
        <div><b>{pending}</b><span>待办</span></div>
      </div>
    </div>
  );
}
