import { Input, Selector, TextArea } from 'antd-mobile';
import { uuid } from '../db/db.js';

const PROGRESS_OPTIONS = [
  { label: '待办理', value: 'todo' },
  { label: '办理中', value: 'doing' },
  { label: '已完成', value: 'done' },
];

// 订单信息：动态增删行（订单号、服务内容、办理进度）
export default function OrderSection({ orders, setOrders }) {
  function update(idx, patch) {
    setOrders(orders.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }
  function add() {
    setOrders([...orders, { id: uuid(), orderNo: '', serviceContent: '', progress: 'todo' }]);
  }
  function remove(idx) {
    setOrders(orders.filter((_, i) => i !== idx));
  }

  return (
    <div className="form-block">
      <h3>订单信息 <span className="badge-idx">{orders.length}</span></h3>
      <div className="hint">记录办理的服务项目与进度</div>

      {orders.map((o, idx) => (
        <div key={o.id} style={{ borderTop: idx ? '1px dashed var(--border)' : 'none', paddingTop: idx ? 12 : 0, marginTop: idx ? 12 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>订单 {idx + 1}</span>
            <button className="row-del-btn" onClick={() => remove(idx)}>删除</button>
          </div>
          <div className="field-label">订单号</div>
          <Input placeholder="订单号" value={o.orderNo} onChange={(v) => update(idx, { orderNo: v })} />
          <div className="field-label">服务内容</div>
          <TextArea placeholder="服务内容描述" rows={2} value={o.serviceContent} onChange={(v) => update(idx, { serviceContent: v })} />
          <div className="field-label">办理进度</div>
          <Selector
            options={PROGRESS_OPTIONS}
            value={[o.progress]}
            onChange={(arr) => arr[0] && update(idx, { progress: arr[0] })}
          />
        </div>
      ))}

      <button className="add-row-btn" onClick={add}>+ 添加订单</button>
    </div>
  );
}
