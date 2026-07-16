import { useEffect, useRef, useState } from 'react';
import { SearchBar, Toast, Dialog, Empty, SpinLoading } from 'antd-mobile';
import CustomerCard from './components/CustomerCard.jsx';
import CustomerDetail from './components/CustomerDetail.jsx';
import CustomerForm from './components/CustomerForm.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import { listCustomers, getCustomer } from './db/customers.js';
import { checkDbAvailable } from './db/db.js';
import { resolveChatId, setManualChatId, getChatName, setChatName } from './lib/chat.js';
import { importZip } from './lib/importZip.js';
import { buildCollectUrl } from './lib/collectLink.js';

export default function App() {
  const [ready, setReady] = useState(false);
  const [dbOk, setDbOk] = useState(true);
  const [chatId, setChatId] = useState(null);
  const [chatName, setChatNameState] = useState('');
  const [view, setView] = useState('list'); // list | detail | form
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null); // 当前详情/编辑对象
  const [exportOpen, setExportOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const importRef = useRef(null);
  const debTimer = useRef(null);

  // 初始化：DB 检测 + chatId 解析
  useEffect(() => {
    (async () => {
      const ok = await checkDbAvailable();
      setDbOk(ok);
      if (!ok) { setReady(true); return; }
      let cid = resolveChatId();
      if (!cid) {
        cid = await promptChatId();
      }
      setChatId(cid);
      setChatNameState(getChatName(cid));
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function promptChatId() {
    return new Promise((resolve) => {
      let val = '';
      Dialog.confirm({
        title: '选择群 / 档案库',
        content: (
          <div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
              未检测到企业微信群 ID，请输入一个标识（如群名或编号）以区分不同档案库。
            </div>
            <input
              autoFocus
              placeholder="例如：group-01"
              style={{ width: '100%', padding: 10, border: '1px solid #D4D9DF', borderRadius: 8, fontSize: 14 }}
              onChange={(e) => (val = e.target.value)}
            />
          </div>
        ),
        onConfirm: () => {
          const id = (val || '').trim() || 'default';
          setManualChatId(id);
          resolve(id);
        },
      });
    });
  }

  // 加载列表
  async function reload(cid = chatId, q = query) {
    if (!cid) return;
    setLoading(true);
    try {
      setCustomers(await listCustomers(cid, q));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (chatId) reload(chatId, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // 搜索 debounce
  function onSearch(v) {
    setQuery(v);
    clearTimeout(debTimer.current);
    debTimer.current = setTimeout(() => reload(chatId, v), 200);
  }

  async function openDetail(id) {
    const c = await getCustomer(id);
    setActive(c);
    setView('detail');
  }

  function newCustomer() {
    setActive(null);
    setView('form');
  }

  async function editActive() {
    setView('form');
  }

  // 导入
  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    Toast.show({ icon: 'loading', content: '正在导入…', duration: 0 });
    try {
      const { imported, skipped } = await importZip(file);
      Toast.clear();
      Toast.show({ content: `导入完成：新增 ${imported} 条，跳过 ${skipped} 条` });
      reload();
    } catch (err) {
      Toast.clear();
      Dialog.alert({ content: '导入失败：' + (err.message || '未知错误') });
    }
  }

  function editChatName() {
    let val = chatName;
    Dialog.confirm({
      title: '设置群名',
      content: (
        <input
          defaultValue={chatName}
          placeholder="给当前档案库起个名字"
          style={{ width: '100%', padding: 10, border: '1px solid #D4D9DF', borderRadius: 8, fontSize: 14 }}
          onChange={(e) => (val = e.target.value)}
        />
      ),
      onConfirm: () => {
        setChatName(chatId, val.trim());
        setChatNameState(val.trim());
      },
    });
  }

  // 生成「客户收集表」分享链接（自动带当前群 chatId）
  function genCollectLink() {
    const url = buildCollectUrl(chatId);
    if (!url) {
      Toast.show({ content: '当前档案库无有效标识' });
      return;
    }
    setLinkUrl(url);
    setLinkOpen(true);
  }

  function copyLink() {
    if (!linkUrl) return;
    const done = () => Toast.show({ icon: 'success', content: '链接已复制' });
    const fail = () => Toast.show({ content: '复制失败，请手动长按复制' });
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(linkUrl).then(done, fail);
    } else {
      fail();
    }
  }

  if (!ready) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <SpinLoading color="primary" />
      </div>
    );
  }

  if (!dbOk) {
    return (
      <div className="app-shell">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <div className="icon">⚠️</div>
          <div className="t">当前环境不支持本地存储</div>
          <div className="d">请勿使用隐私/无痕模式，换用普通浏览器窗口打开。</div>
        </div>
      </div>
    );
  }

  // 详情页
  if (view === 'detail' && active) {
    return (
      <div className="app-shell">
        <CustomerDetail
          customer={active}
          onBack={() => setView('list')}
          onEdit={editActive}
          onDeleted={() => { setView('list'); reload(); }}
        />
      </div>
    );
  }

  // 表单页
  if (view === 'form') {
    return (
      <div className="app-shell">
        <CustomerForm
          chatId={chatId}
          initial={active}
          onCancel={() => setView(active ? 'detail' : 'list')}
          onDone={async () => {
            await reload();
            if (active?.id) {
              const fresh = await getCustomer(active.id);
              setActive(fresh);
              setView('detail');
            } else {
              setView('list');
            }
          }}
        />
      </div>
    );
  }

  // 列表页
  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="title-row">
          <div style={{ fontSize: 18, fontWeight: 700 }}>客户档案库</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="grp" onClick={editChatName} style={{ cursor: 'pointer' }}>
              <span className="dot" />
              {chatName || chatId || '未命名群'} ✎
            </div>
            <button className="link-btn" onClick={genCollectLink}>↗ 收集表</button>
          </div>
        </div>
        <SearchBar
          placeholder="搜索公司名 / 法人名"
          value={query}
          onChange={onSearch}
          style={{ '--border-radius': '10px', '--background': '#F1F3F5' }}
        />
      </div>

      <div className="content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📁</div>
            <div className="t">{query ? '没有匹配的客户' : '还没有客户档案'}</div>
            <div className="d">{query ? '换个关键词试试' : '点击右下角 + 新增第一位客户'}</div>
          </div>
        ) : (
          customers.map((c) => (
            <CustomerCard key={c.id} customer={c} onClick={() => openDetail(c.id)} />
          ))
        )}
      </div>

      <button className="fab" onClick={newCustomer}>+</button>

      <div className="bottombar">
        <div className="b" onClick={() => importRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
          导入
        </div>
        <div className="b" onClick={() => setExportOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21V9m0 0l-4 4m4-4l4 4" /><path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2" /></svg>
          导出
        </div>
      </div>

      <input ref={importRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleImport} />
      <ExportPanel visible={exportOpen} onClose={() => setExportOpen(false)} chatId={chatId} />

      {linkOpen && (
        <div className="success-mask" onClick={() => setLinkOpen(false)}>
          <div className="success-card" onClick={(e) => e.stopPropagation()}>
            <div className="st">收集表链接</div>
            <div className="sd">把链接发给客户，客户填写并导出的文件，在档案库导入后将自动归入当前群。</div>
            <div className="link-box">{linkUrl}</div>
            <div className="sbtn" onClick={copyLink}>复制链接</div>
            <div className="slink" onClick={() => setLinkOpen(false)}>关闭</div>
          </div>
        </div>
      )}
    </div>
  );
}
