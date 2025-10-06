import React, { useState, useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mouse = { x: 0, y: 0 };
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      connections: number[];
    }> = [];

    // Criar partículas
    const createParticles = () => {
      particles = [];
      for (let i = 0; i < 300; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          connections: []
        });
      }
    };

    // Atualizar partículas
    const updateParticles = () => {
      particles.forEach(particle => {
        // Interação com mouse (repulsão)
        const mouseDx = particle.x - mouse.x;
        const mouseDy = particle.y - mouse.y;
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        
        if (mouseDistance < 100 && mouseDistance > 0) {
          const force = (100 - mouseDistance) / 100;
          const repelForce = force * 1.2;
          
          particle.vx += (mouseDx / mouseDistance) * repelForce;
          particle.vy += (mouseDy / mouseDistance) * repelForce;
        }

        // Movimento normal
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Limitar velocidade máxima
        const maxSpeed = 3;
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }
      });
    };

    // Desenhar rede neural
    const drawNetwork = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar conexões entre partículas (estilo limpo)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 140) {
            const opacity = 1 - (distance / 140);
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Desenhar partículas (simples e limpo)
      particles.forEach(particle => {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Loop de animação
    const animate = () => {
      updateParticles();
      drawNetwork();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    // Inicializar
    handleResize();
    animate();

    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        }}
      />
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🧠</div>
            <div style={styles.logoText}>
              <div style={styles.logoTitle}>SS-Finanças</div>
              <div style={styles.logoSubtitle}>Sistema Neural</div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.loginForm}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Login</label>
            <input 
              style={styles.input} 
              value={login} 
              onChange={(e) => setLogin(e.target.value)} 
              placeholder="Digite seu login"
              autoComplete="username"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Senha</label>
            <input 
              style={styles.input} 
              type="password" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </div>
          
          {erro && <div style={styles.error}>{erro}</div>}
          
          <button style={styles.primaryBtn} type="submit">
            <span style={styles.btnText}>Conectar</span>
            <span style={styles.btnIcon}>→</span>
          </button>
        </form>
        
        <div style={styles.loginFooter}>
          <div style={styles.footerText}>Sistema de Controle Financeiro</div>
          <div style={styles.footerSubtext}>Powered by Neural Network</div>
        </div>
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
  loginRoot: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative',
    overflow: 'hidden'
  },
  loginCard: { 
    width: 420, 
    background: 'rgba(255, 255, 255, 0.95)', 
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)', 
    borderRadius: 20, 
    padding: 0,
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    zIndex: 10,
    position: 'relative',
    overflow: 'hidden'
  },
  loginHeader: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    padding: '30px 30px 20px',
    textAlign: 'center',
    position: 'relative'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  logoIcon: {
    fontSize: 32,
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: 60,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)'
  },
  logoText: {
    textAlign: 'left'
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  logoSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
    fontWeight: 500
  },
  loginForm: {
    padding: '30px 30px 20px'
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: { 
    display: 'block', 
    fontSize: 14, 
    color: '#374151', 
    marginBottom: 8,
    fontWeight: 600
  },
  input: { 
    width: '100%', 
    padding: '14px 16px', 
    borderRadius: 12, 
    border: '2px solid #e5e7eb', 
    fontSize: 16,
    background: '#ffffff',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  },
  error: { 
    color: '#dc2626', 
    fontSize: 14, 
    marginTop: 8,
    background: '#fef2f2',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #fecaca'
  },
  primaryBtn: { 
    width: '100%', 
    marginTop: 20, 
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: 12, 
    padding: '16px 20px', 
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
  },
  btnText: {
    flex: 1
  },
  btnIcon: {
    fontSize: 18,
    transition: 'transform 0.3s ease'
  },
  loginFooter: {
    background: '#f8fafc',
    padding: '20px 30px',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb'
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 500,
    margin: 0
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    margin: '4px 0 0',
    fontStyle: 'italic'
  }
};


