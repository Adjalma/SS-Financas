import React, { useState } from 'react';
import { GastosPessoais } from './views/GastosPessoais';
import { Empresa } from './views/Empresa';
import { Holerite } from './views/Holerite';

type TabKey = 'empresa' | 'pessoais' | 'holerite';

export const App: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return localStorage.getItem('ssf_admin_authed') === '1';
  });

  const [tab, setTab] = useState<TabKey>('pessoais');

  if (!isAuthed) {
    return <Login onSuccess={() => setIsAuthed(true)} />;
  }

  return (
    <div style={styles.appRoot}>
      <header className="app" style={styles.header}>
        <div style={styles.brand}>
          <img src="/logo-ss-financas.svg" alt="SS-Finanças" style={{ width: 28, height: 28, marginRight: 8 }} />
          <span>SS-Finanças</span>
        </div>
        <nav className="tabs" style={styles.nav}>
          <button className={tab === 'empresa' ? 'active' : ''} style={styles.navBtn} onClick={() => setTab('empresa')}>Finanças Empresa</button>
          <button className={tab === 'pessoais' ? 'active' : ''} style={styles.navBtn} onClick={() => setTab('pessoais')}>Finanças Pessoais</button>
          <button className={tab === 'holerite' ? 'active' : ''} style={styles.navBtn} onClick={() => setTab('holerite')}>Holerite</button>
        </nav>
        <div style={{flex: 1}} />
        <button style={styles.linkBtn} onClick={() => { localStorage.removeItem('ssf_admin_authed'); setIsAuthed(false); }}>Sair</button>
      </header>

      <main style={styles.main}>
        {tab === 'empresa' ? <Empresa /> : tab === 'pessoais' ? <GastosPessoais /> : <Holerite />}
      </main>
    </div>
  );
};

const Login: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === '10665909748' && senha === 'manogengiS10*') {
      localStorage.setItem('ssf_admin_authed', '1');
      onSuccess();
    } else {
      setErro('Credenciais inválidas');
    }
  };

  return (
    <div style={styles.loginRoot}>
      <div style={styles.loginCard}>
        <div style={styles.loginTitle}>Acesso Administrador</div>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Login</label>
          <input style={styles.input} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Digite seu login" />
          <label style={styles.label}>Senha</label>
          <input style={styles.input} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" />
          {erro && <div style={styles.error}>{erro}</div>}
          <button style={styles.primaryBtn} type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
};

// Iframe removido em favor da nova view React

const styles: Record<string, React.CSSProperties> = {
  appRoot: { minHeight: '100vh', background: 'transparent', color: '#111827' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1f2a44' },
  brand: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 20, color: '#ffffff' },
  nav: { display: 'flex', gap: 8 },
  navBtn: { background: 'transparent', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: '#cbd5e1' },
  navBtnActive: { },
  linkBtn: { background: 'transparent', border: '1px solid #1f2a44', color: '#ef4444', cursor: 'pointer', padding: '6px 10px', borderRadius: 8 },
  main: { padding: 16, maxWidth: 1280, margin: '0 auto' },
  section: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 },
  h2: { margin: 0, color: '#111827', fontSize: 20 },
  muted: { color: '#6b7280', marginTop: 8 },
  loginRoot: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  loginCard: { width: 360, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  loginTitle: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  label: { display: 'block', fontSize: 12, color: '#6b7280', marginTop: 8 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 },
  error: { color: '#b91c1c', fontSize: 12, marginTop: 8 },
  primaryBtn: { width: '100%', marginTop: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }
};


