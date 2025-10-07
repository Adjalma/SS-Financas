import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';
import { useSharedData } from '../../hooks/useSharedData';
import { loadMonthData, saveMonthData } from '../../lib/supabase';

type Extra = { descricao: string; data: string; aguiar: number; bardela: number };

export const GastosPessoais: React.FC = () => {
  const [mes, setMes] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const {
    gastosFixos,
    setGastosFixos
  } = useSharedData();
  
  const [cartaoAguiar, setCartaoAguiar] = useState<number>(0);
  const [cartaoBardela, setCartaoBardela] = useState<number>(0);
  const [extras, setExtras] = useState<Extra[]>([{ descricao: '', data: '', aguiar: 0, bardela: 0 }]);

  useEffect(() => {
    (async () => {
      const dados = await loadMonthData(mes);
      if (dados) {
        // Evita sobrepor os valores padrão com lista vazia
        if (Array.isArray(dados.gastosFixos) && dados.gastosFixos.length > 0) {
          setGastosFixos(dados.gastosFixos);
        }
        setCartaoAguiar(Number(dados.cartoes.aguiar) || 0);
        setCartaoBardela(Number(dados.cartoes.bardela) || 0);
        setExtras(dados.gastosExtras.length ? dados.gastosExtras : [{ descricao: '', data: '', aguiar: 0, bardela: 0 }]);
      } else {
        // fallback localStorage já é tratado dentro de loadMonthData
      }
    })();
  }, [mes]);

  const totals = useMemo(() => {
    let totalFixosValor = 0;
    let totalFixosAguiar = 0;
    let totalFixosBardela = 0;
    let combustivel = 0, psicologa = 0, futebol = 0, cinema = 0, revisaoCarro = 0, seguro = 0;
    gastosFixos.forEach((g) => {
      const metade = g.valor / 2;
      totalFixosValor += g.valor;
      totalFixosAguiar += metade;
      totalFixosBardela += metade;
      if (g.categoria === 'Combustível') combustivel = g.valor;
      if (g.categoria === 'Psicóloga') psicologa = g.valor;
      if (g.categoria === 'Futebol') futebol = g.valor;
      if (g.categoria === 'Cinema') cinema = g.valor;
      if (g.categoria === 'Revisão do Carro') revisaoCarro = g.valor;
      if (g.categoria === 'Seguro') seguro = g.valor;
    });
    const totalGastoFixoCartao = combustivel + psicologa + futebol + cinema + revisaoCarro;
    const extrasAg = extras.reduce((s, e) => s + (e.aguiar || 0), 0);
    const extrasBd = extras.reduce((s, e) => s + (e.bardela || 0), 0);
    const totalVariaveis = extrasAg + extrasBd;
    const somatoriaTotal = totalGastoFixoCartao + seguro + totalVariaveis;
    const totalCartao = cartaoAguiar + cartaoBardela;
    const totalAg = totalFixosAguiar + cartaoAguiar + extrasAg;
    const totalBd = totalFixosBardela + cartaoBardela + extrasBd;
    const totalGeral = totalAg + totalBd;
    const diferenca = Math.abs(totalAg - totalBd);
    const percAg = totalGeral > 0 ? Number(((totalAg / totalGeral) * 100).toFixed(1)) : 50;
    const percBd = totalGeral > 0 ? Number(((totalBd / totalGeral) * 100).toFixed(1)) : 50;
    return { totalFixosValor, totalFixosAguiar, totalFixosBardela, totalGastoFixoCartao, seguro, totalVariaveis, somatoriaTotal, totalCartao, totalAg, totalBd, totalGeral, diferenca, percAg, percBd };
  }, [gastosFixos, extras, cartaoAguiar, cartaoBardela]);

  const salvar = async () => {
    try {
      await saveMonthData({
        mes,
        gastosFixos,
        cartoes: { aguiar: cartaoAguiar, bardela: cartaoBardela },
        gastosExtras: extras,
      });
      alert('Dados salvos!');
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || e?.error?.message || 'Falha ao salvar.';
      alert(`Falha ao salvar: ${msg}`);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.title}>Gastos Pessoais</div>
          <div style={styles.subtitle}>Família Aguiar Bardela</div>
        </div>
        <div style={styles.topbarRight}>
          <input style={styles.month} type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
          <button style={styles.primary} onClick={salvar}>Salvar mês</button>
        </div>
      </div>

      <h3 style={styles.h3}>Cards - Gastos Pessoais</h3>
      <div style={styles.cards}>
        <Metric label="Total Família" value={formatMoeda(totals.totalGeral)} />
        <Metric label="Adjalma" value={formatMoeda(totals.totalAg)} />
        <Metric label="Eliete" value={formatMoeda(totals.totalBd)} />
        <Metric label="Diferença" value={formatMoeda(totals.diferenca)} warning={totals.diferenca > 0} />
      </div>

      <section style={styles.section}>
        <h3 style={styles.h3Big}>Gastos Fixos (50/50)</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table as any}>
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Valor Real (R$)</th>
                <th style={{...styles.th, textAlign: 'center'}}>Aguiar 50%</th>
                <th style={{...styles.th, textAlign: 'center'}}>Bardela 50%</th>
                <th style={styles.th}>Pago</th>
              </tr>
            </thead>
            <tbody>
              {gastosFixos.map((g, idx) => {
                const metade = g.valor / 2;
                return (
                  <tr key={g.categoria} style={idx % 2 === 0 ? styles.trAlt : undefined}>
                    <td style={{ color: '#111827', fontWeight: 700 }}>{g.categoria}</td>
                    <td>
                      <input style={styles.inputNum} type="number" step="0.01" value={g.valor === 0 ? '' : g.valor}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0;
                          setGastosFixos((arr) => arr.map((it, i) => i === idx ? { ...it, valor: v } : it));
                        }} />
                    </td>
                    <td style={{...styles.rightStrongBlue, ...styles.money, textAlign: 'center'}}>{formatMoeda(metade)}</td>
                    <td style={{...styles.rightStrongGreen, ...styles.money, textAlign: 'center'}}>{formatMoeda(metade)}</td>
                    <td style={{textAlign:'center'}}>
                      <label style={styles.pill}>
                        <input type="checkbox" checked={g.pago} onChange={(e) => setGastosFixos((arr) => arr.map((it, i) => i === idx ? { ...it, pago: e.target.checked } : it))} />
                        <span style={{ marginLeft: 6 }}>{g.pago ? 'Pago' : 'Aberto'}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ color: '#111827', fontWeight: 800 }}>Total</td>
                <td style={{ ...styles.money, color: '#111827', fontWeight: 800 }}>{formatMoeda(totals.totalFixosValor)}</td>
                <td style={{ ...styles.money, color: '#1d4ed8', fontWeight: 900, textAlign: 'center' }}>{formatMoeda(totals.totalFixosAguiar)}</td>
                <td style={{ ...styles.money, color: '#047857', fontWeight: 900, textAlign: 'center' }}>{formatMoeda(totals.totalFixosBardela)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section style={styles.sectionRow}>
        <div style={styles.sectionCol}>
          <h3 style={styles.h3}>Cartões</h3>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Cartão Adjalma</label>
              <input style={styles.inputNum} type="number" step="0.01" value={cartaoAguiar === 0 ? '' : cartaoAguiar} onChange={(e) => setCartaoAguiar(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label style={styles.label}>Cartão Eliete</label>
              <input style={styles.inputNum} type="number" step="0.01" value={cartaoBardela === 0 ? '' : cartaoBardela} onChange={(e) => setCartaoBardela(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div style={styles.muted}>Total: {formatMoeda(totals.totalCartao)}</div>
        </div>
        <div style={styles.sectionCol}>
          <h3 style={styles.h3}>Somatória Total (Retorno)</h3>
          <div style={styles.grid3}>
            <Metric label="Gasto Fixo Cartão" value={formatMoeda(totals.totalGastoFixoCartao)} small />
            <Metric label="Conta Eliete (Seguro)" value={formatMoeda(totals.seguro)} small />
            <Metric label="Variáveis" value={formatMoeda(totals.totalVariaveis)} small />
          </div>
          <div style={styles.totalStrong}>TOTAL: {formatMoeda(totals.somatoriaTotal)}</div>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.h3}>Gastos Variáveis / Extras</h3>
        {extras.map((e, idx) => (
          <div key={idx} style={styles.extraRow}>
            <input style={styles.input} placeholder="Descrição" value={e.descricao} onChange={(ev) => setExtras((arr) => arr.map((it, i) => i === idx ? { ...it, descricao: ev.target.value } : it))} />
            <input style={styles.input} type="date" value={e.data} onChange={(ev) => setExtras((arr) => arr.map((it, i) => i === idx ? { ...it, data: ev.target.value } : it))} />
            <input style={styles.inputNum} type="number" step="0.01" value={e.aguiar === 0 ? '' : e.aguiar} onChange={(ev) => setExtras((arr) => arr.map((it, i) => i === idx ? { ...it, aguiar: Number(ev.target.value) || 0 } : it))} />
            <input style={styles.inputNum} type="number" step="0.01" value={e.bardela === 0 ? '' : e.bardela} onChange={(ev) => setExtras((arr) => arr.map((it, i) => i === idx ? { ...it, bardela: Number(ev.target.value) || 0 } : it))} />
            <button style={styles.danger} onClick={() => setExtras((arr) => arr.filter((_, i) => i !== idx))}>Remover</button>
          </div>
        ))}
        <div>
          <button style={styles.secondary} onClick={() => setExtras((arr) => [...arr, { descricao: '', data: '', aguiar: 0, bardela: 0 }])}>Adicionar Gasto</button>
        </div>
        <div style={styles.totaisExtra}>
          <span>Adjalma: {formatMoeda(extras.reduce((s, e) => s + (e.aguiar || 0), 0))}</span>
          <span>Eliete: {formatMoeda(extras.reduce((s, e) => s + (e.bardela || 0), 0))}</span>
          <span>Total: {formatMoeda(extras.reduce((s, e) => s + (e.aguiar || 0) + (e.bardela || 0), 0))}</span>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.h3Big}>Dashboard Principal</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 16 }}>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Maiores Gastos Fixos</h4>
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFixos(gastosFixos)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Indicadores</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <Kpi label="Fixos" value={formatMoeda(totals.totalFixosValor)} />
              <Kpi label="Variáveis" value={formatMoeda(totals.totalVariaveis)} />
              <Kpi label="Cartões" value={formatMoeda(totals.totalCartao)} />
            </div>
          </div>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Evolução (Componentes)</h4>
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{ name: 'Fixos', total: totals.totalFixosValor }, { name: 'Cartão', total: totals.totalGastoFixoCartao }, { name: 'Variáveis', total: totals.totalVariaveis }, { name: 'Seguro', total: totals.seguro }]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <YAxis tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ height: 260 }}>
            <h4 style={styles.blockTitle}>Distribuição dos Fixos</h4>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie dataKey="value" data={gastosFixos.map(g => ({ name: g.categoria, value: g.valor }))} outerRadius={80} innerRadius={20}>
                    {gastosFixos.map((g, i) => (<Cell key={g.categoria} fill={chartColors[i % chartColors.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <h4 style={styles.blockTitle}>Variáveis (Aguiar x Eliete)</h4>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={extras.map(e => ({ name: e.descricao || '—', aguiar: e.aguiar, bardela: e.bardela }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" hide tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                  <YAxis tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="aguiar" fill="#60a5fa" />
                  <Bar dataKey="bardela" fill="#f472b6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Calculadora removida */}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; small?: boolean; warning?: boolean }> = ({ label, value, small, warning }) => (
  <div style={{ ...styles.metric, ...(small ? styles.metricSmall : {}), ...(warning ? styles.metricWarn : {}) }}>
    <div style={styles.metricLabel}>{label}</div>
    <div style={styles.metricValue}>{value}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { color: '#6b7280', fontSize: 12 },
  topbarRight: { display: 'flex', gap: 8, alignItems: 'center' },
  month: { padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' },
  primary: { background: '#2563eb', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: 8, cursor: 'pointer' },
  secondary: { background: '#e5e7eb', color: '#111827', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' },
  danger: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 },
  metric: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#ffffff' },
  metricSmall: { padding: 10 },
  metricWarn: { borderColor: '#fecaca', background: '#fff1f2' },
  metricLabel: { fontSize: 12, color: '#6b7280' },
  metricValue: { fontSize: 28, fontWeight: 800, color: '#111827' },
  section: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#ffffff' },
  sectionRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  sectionCol: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#ffffff' },
  h3: { margin: 0, marginBottom: 12, fontSize: 16 },
  h3Big: { margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 800 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, color: '#0f172a' },
  th: { color: '#111827', textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5 },
  input: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a' },
  inputNum: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a' },
  trAlt: { background: '#f8fafc' },
  right: { textAlign: 'right' },
  rightStrong: { textAlign: 'right', color: '#111827', fontWeight: 800 },
  rightStrongBlue: { textAlign: 'right', color: '#1d4ed8', fontWeight: 800 },
  rightStrongGreen: { textAlign: 'right', color: '#047857', fontWeight: 800 },
  pill: { display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#ffffff', color: '#111827' },
  money: { fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  totalStrong: { marginTop: 12, fontWeight: 700 },
  extraRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 },
  totaisExtra: { display: 'flex', gap: 16, marginTop: 8, color: '#374151' },
  aside: { }
};

function formatMoeda(n: number): string {
  return 'R$ ' + (n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const chartColors = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f87171','#2dd4bf','#c4b5fd'];

const Kpi: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, background: '#ffffff' }}>
    <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{value}</div>
  </div>
);

function topFixos(gastosFixos: { categoria: string; valor: number }[]) {
  return [...gastosFixos]
    .map(g => ({ name: g.categoria, value: g.valor }))
    .sort((a,b)=>b.value-a.value)
    .slice(0,6);
}


