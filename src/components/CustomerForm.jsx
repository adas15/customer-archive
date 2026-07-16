import { useState } from 'react';
import { Input, Toast } from 'antd-mobile';
import ImageField from './ImageField.jsx';
import ShareholderSection from './ShareholderSection.jsx';
import OrderSection from './OrderSection.jsx';
import { saveCustomer } from '../db/customers.js';

// 新增 / 编辑共用表单
export default function CustomerForm({ chatId, initial, onDone, onCancel }) {
  const [companyName, setCompanyName] = useState(initial?.companyName || '');
  const [legalPersonName, setLegalPersonName] = useState(initial?.legalPersonName || '');
  const [legalPersonPhone, setLegalPersonPhone] = useState(initial?.legalPersonPhone || '');
  const [businessLicense, setBusinessLicense] = useState(initial?.businessLicense || '');
  const [legalPortrait, setLegalPortrait] = useState(initial?.legalPortrait || '');
  const [legalIdFront, setLegalIdFront] = useState(initial?.legalIdFront || '');
  const [legalIdBack, setLegalIdBack] = useState(initial?.legalIdBack || '');
  const [shareholders, setShareholders] = useState(initial?.shareholders || []);
  const [orders, setOrders] = useState(initial?.orders || []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!companyName.trim()) {
      Toast.show({ content: '请填写公司名' });
      return;
    }
    setSaving(true);
    try {
      await saveCustomer({
        ...initial,
        chatId,
        companyName: companyName.trim(),
        legalPersonName: legalPersonName.trim(),
        legalPersonPhone: legalPersonPhone.trim(),
        businessLicense, legalPortrait, legalIdFront, legalIdBack,
        shareholders, orders,
      });
      Toast.show({ icon: 'success', content: '已保存' });
      onDone();
    } catch (e) {
      Toast.show({ content: '保存失败：' + e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="navbar">
        <div className="back" onClick={onCancel}>取消</div>
        <div className="title">{initial?.id ? '编辑客户' : '新增客户'}</div>
        <div className="act" style={{ color: 'var(--brand)' }} onClick={saving ? undefined : handleSave}>
          {saving ? '保存中…' : '保存'}
        </div>
      </div>

      <div className="content">
        {/* 公司信息 */}
        <div className="form-block">
          <h3>公司信息</h3>
          <div className="hint">营业执照将随档案导出</div>
          <div className="field-label">公司名 *</div>
          <Input placeholder="请输入公司全称" value={companyName} onChange={setCompanyName} />
          <div className="field-label">营业执照</div>
          <div className="img-grid">
            <ImageField label="上传营业执照" icon="📄" value={businessLicense} onChange={setBusinessLicense} />
            <div />
          </div>
        </div>

        {/* 法人信息 */}
        <div className="form-block">
          <h3>法人信息</h3>
          <div className="field-label">法人姓名</div>
          <Input placeholder="法人姓名" value={legalPersonName} onChange={setLegalPersonName} />
          <div className="field-label">法人电话</div>
          <Input placeholder="联系电话" type="tel" value={legalPersonPhone} onChange={setLegalPersonPhone} />
          <div className="field-label">半身照片</div>
          <div className="img-grid">
            <ImageField label="法人半身照" icon="🧑" value={legalPortrait} onChange={setLegalPortrait} />
            <div />
          </div>
          <div className="field-label">身份证正反面</div>
          <div className="img-grid">
            <ImageField label="身份证正面" icon="🪪" value={legalIdFront} onChange={setLegalIdFront} />
            <ImageField label="身份证反面" icon="🪪" value={legalIdBack} onChange={setLegalIdBack} />
          </div>
        </div>

        {/* 股东信息 */}
        <ShareholderSection shareholders={shareholders} setShareholders={setShareholders} />

        {/* 订单信息 */}
        <OrderSection orders={orders} setOrders={setOrders} />
      </div>
    </>
  );
}
