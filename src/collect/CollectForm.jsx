import { useState } from 'react';
import { Input, Toast } from 'antd-mobile';
import ImageFieldCollect from './ImageFieldCollect.jsx';
import ShareholderSectionCollect from './ShareholderSectionCollect.jsx';
import OrderSection from '../components/OrderSection.jsx';
import { buildArchiveBlob } from '../lib/zipBuilder.js';
import { triggerDownload, ts } from '../lib/download.js';

// 客户自助填写表单（内存态，不落库）。填完导出 zip 即可，关闭页面不留存数据。
export default function CollectForm({ chatId, imagesRef, onExported }) {
  const [companyName, setCompanyName] = useState('');
  const [legalPersonName, setLegalPersonName] = useState('');
  const [legalPersonPhone, setLegalPersonPhone] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [legalPortrait, setLegalPortrait] = useState('');
  const [legalIdFront, setLegalIdFront] = useState('');
  const [legalIdBack, setLegalIdBack] = useState('');
  const [shareholders, setShareholders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [exporting, setExporting] = useState(false);

  // 轻量必填校验：公司名 / 法人姓名 / 法人电话 / 法人身份证正面
  function validate() {
    if (!companyName.trim()) return '请填写公司名';
    if (!legalPersonName.trim()) return '请填写法人姓名';
    if (!legalPersonPhone.trim()) return '请填写法人电话';
    if (!legalIdFront) return '请上传法人身份证正面';
    return null;
  }

  async function handleExport() {
    const err = validate();
    if (err) {
      Toast.show({ content: err });
      return;
    }
    setExporting(true);
    try {
      const customer = {
        id: 'c' + Date.now().toString(36),
        chatId: chatId || '',
        companyName: companyName.trim(),
        legalPersonName: legalPersonName.trim(),
        legalPersonPhone: legalPersonPhone.trim(),
        businessLicense,
        legalPortrait,
        legalIdFront,
        legalIdBack,
        shareholders,
        orders,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const blob = await buildArchiveBlob([customer], imagesRef.current, {
        chatId: chatId || '',
        source: 'collect',
      });
      const safe = (companyName.trim() || 'export').replace(/[\\/:*?"<>|]/g, '_');
      triggerDownload(blob, `客户资料-${safe}-${ts()}.zip`);
      onExported();
    } catch (e) {
      Toast.show({ content: '导出失败：' + (e.message || '未知错误') });
    } finally {
      setExporting(false);
    }
  }

  function handleClear() {
    imagesRef.current.clear();
    setCompanyName('');
    setLegalPersonName('');
    setLegalPersonPhone('');
    setBusinessLicense('');
    setLegalPortrait('');
    setLegalIdFront('');
    setLegalIdBack('');
    setShareholders([]);
    setOrders([]);
  }

  return (
    <>
      <div className="content">
        {/* 公司信息 */}
        <div className="form-block">
          <h3>公司信息</h3>
          <div className="hint">营业执照将随资料一同导出</div>
          <div className="field-label">公司名 <span className="req">*</span></div>
          <Input placeholder="请输入公司全称" value={companyName} onChange={setCompanyName} />
          <div className="field-label">营业执照</div>
          <div className="img-grid">
            <ImageFieldCollect label="上传营业执照" icon="📄" value={businessLicense} onChange={setBusinessLicense} imagesRef={imagesRef} />
            <div />
          </div>
        </div>

        {/* 法人信息 */}
        <div className="form-block">
          <h3>法人信息</h3>
          <div className="field-label">法人姓名 <span className="req">*</span></div>
          <Input placeholder="法人姓名" value={legalPersonName} onChange={setLegalPersonName} />
          <div className="field-label">法人电话 <span className="req">*</span></div>
          <Input placeholder="联系电话" type="tel" value={legalPersonPhone} onChange={setLegalPersonPhone} />
          <div className="field-label">半身照片</div>
          <div className="img-grid">
            <ImageFieldCollect label="法人半身照" icon="🧑" value={legalPortrait} onChange={setLegalPortrait} imagesRef={imagesRef} />
            <div />
          </div>
          <div className="field-label">身份证正反面 <span className="req">*</span></div>
          <div className="img-grid">
            <ImageFieldCollect label="身份证正面" icon="🪪" value={legalIdFront} onChange={setLegalIdFront} imagesRef={imagesRef} />
            <ImageFieldCollect label="身份证反面" icon="🪪" value={legalIdBack} onChange={setLegalIdBack} imagesRef={imagesRef} />
          </div>
        </div>

        {/* 股东信息（收集表内存版） */}
        <ShareholderSectionCollect shareholders={shareholders} setShareholders={setShareholders} imagesRef={imagesRef} />

        {/* 订单信息（复用档案库，无图片、不落库） */}
        <OrderSection orders={orders} setOrders={setOrders} />
      </div>

      {/* 底部操作栏：清空 / 导出 */}
      <div className="collect-bottombar">
        <button className="cb-clear" onClick={handleClear}>清空</button>
        <button className="cb-export" onClick={handleExport} disabled={exporting}>
          {exporting ? '导出中…' : '导出文件'}
        </button>
      </div>
    </>
  );
}
