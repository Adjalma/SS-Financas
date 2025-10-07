import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSharedData } from '../../hooks/useSharedData';


export const Holerite: React.FC = () => {
  const [mes, setMes] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const {
    salarios,
    setSalarios,
    recebiveisEmpresa,
    setRecebiveisEmpresa,
    inssEmpresa,
    setInssEmpresa,
    calcularTotais
  } = useSharedData();

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const formatMoeda = (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const totals = calcularTotais();

  const chartData = {
    distribuicaoSalarios: salarios.map(s => ({ name: s.nome, value: s.salarioLiquido })),
    recebiveisEmpresa: recebiveisEmpresa.map(r => ({ name: r.descricao, value: r.valor })),
    evolucaoMensal: [
      { mes: 'Jan', salarios: totals.totalSalariosLiquidos, empresa: totals.totalRecebiveisEmpresa, inss: totals.totalInssEmpresa },
      { mes: 'Fev', salarios: totals.totalSalariosLiquidos * 0.95, empresa: totals.totalRecebiveisEmpresa * 1.1, inss: totals.totalInssEmpresa },
      { mes: 'Mar', salarios: totals.totalSalariosLiquidos * 1.05, empresa: totals.totalRecebiveisEmpresa * 0.9, inss: totals.totalInssEmpresa },
      { mes: 'Abr', salarios: totals.totalSalariosLiquidos, empresa: totals.totalRecebiveisEmpresa, inss: totals.totalInssEmpresa }
    ]
  };

  const salvarDados = async () => {
    try {
      const { getSupabase } = await import('../../lib/supabase');
      const sb = getSupabase();
      if (!sb) {
        localStorage.setItem(`holerite_${mes}`, JSON.stringify({ salarios, recebiveisEmpresa, inssEmpresa }));
        alert('Dados salvos localmente.');
        return;
      }
      await sb.from('months').upsert({ year_month: mes }, { onConflict: 'year_month' }).throwOnError();
      const { data: monthRow, error: monthErr } = await sb.from('months').select('*').eq('year_month', mes).single();
      if (monthErr || !monthRow) throw monthErr || new Error('Mês não encontrado');
      const monthId = monthRow.id;
      let resp;
      resp = await sb.from('salaries').delete().eq('month_id', monthId);
      if (resp.error) throw resp.error;
      resp = await sb.from('company_receivables').delete().eq('month_id', monthId);
      if (resp.error) throw resp.error;
      resp = await sb.from('company_taxes').delete().eq('month_id', monthId).eq('tax_type', 'inss');
      if (resp.error) throw resp.error;
      if (salarios.length) {
        const { error } = await sb.from('salaries').insert(salarios.map(s=>({ month_id: monthId, employee_name: s.nome, gross_salary: s.salarioBruto, inss_deduction: s.descontos.inss, irrf_deduction: s.descontos.irrf, other_deductions: s.descontos.outros, net_salary: s.salarioLiquido, paid: s.pago })));
        if (error) throw error;
      }
      if (recebiveisEmpresa.length) {
        const { error } = await sb.from('company_receivables').insert(recebiveisEmpresa.map(r=>({ month_id: monthId, description: r.descricao, amount: r.valor, due_date: r.data||null, received: r.pago })));
        if (error) throw error;
      }
      {
        const { error } = await sb.from('company_taxes').insert({ month_id: monthId, tax_type: 'inss', amount: inssEmpresa.valor||0, due_date: (inssEmpresa as any).vencimento||null, paid: inssEmpresa.pago });
        if (error) throw error;
      }
      alert('Dados salvos com sucesso.');
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
          <h2 style={styles.title}>HOLERITE FAMILIAR</h2>
          <p style={styles.subtitle}>Controle de Recebíveis e Salários</p>
        </div>
        <div style={styles.topbarRight}>
          <div style={styles.month}>
            <input type="month" value={mes} onChange={(e)=>setMes(e.target.value)} />
          </div>
          <button style={styles.primary} onClick={salvarDados}>Salvar Dados</button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div style={styles.kpiGrid}>
        <Metric label="Receita Total Mensal" value={formatMoeda(totals.receitaTotal)} />
        <Metric label="Salários Líquidos" value={formatMoeda(totals.totalSalariosLiquidos)} />
        <Metric label="Recebíveis Empresa" value={formatMoeda(totals.totalRecebiveisEmpresa)} />
        <Metric label="INSS Empresa" value={formatMoeda(totals.totalInssEmpresa)} warning />
      </div>

      {/* Saldo Líquido Familiar */}
      <section style={styles.section}>
        <h3 style={styles.h3Big}>Saldo Líquido Familiar</h3>
        <div style={styles.saldoGrid}>
          <div style={styles.saldoCard}>
            <h4 style={styles.saldoTitle}>Receitas</h4>
            <div style={styles.saldoItem}>
              <span>Salários Líquidos:</span>
              <span style={styles.saldoValue}>{formatMoeda(totals.totalSalariosLiquidos)}</span>
            </div>
            <div style={styles.saldoItem}>
              <span>Recebíveis Empresa:</span>
              <span style={styles.saldoValue}>{formatMoeda(totals.totalRecebiveisEmpresa)}</span>
            </div>
            <div style={styles.saldoItem}>
              <span>INSS Empresa:</span>
              <span style={styles.saldoValueNegative}>-{formatMoeda(totals.totalInssEmpresa)}</span>
            </div>
            <div style={styles.saldoTotal}>
              <span>Total Receitas:</span>
              <span style={styles.saldoTotalValue}>{formatMoeda(totals.receitaTotal)}</span>
            </div>
          </div>

          <div style={styles.saldoCard}>
            <h4 style={styles.saldoTitle}>Despesas</h4>
            <div style={styles.saldoItem}>
              <span>Gastos Fixos:</span>
              <span style={styles.saldoValueNegative}>-{formatMoeda(totals.totalGastosFixos)}</span>
            </div>
            <div style={styles.saldoItem}>
              <span>Gastos Variáveis:</span>
              <span style={styles.saldoValueNegative}>-{formatMoeda(totals.totalGastosVariaveis)}</span>
            </div>
            <div style={styles.saldoTotal}>
              <span>Total Despesas:</span>
              <span style={styles.saldoTotalValueNegative}>-{formatMoeda(totals.despesaTotal)}</span>
            </div>
          </div>

          <div style={styles.saldoCardFinal}>
            <h4 style={styles.saldoTitleFinal}>Saldo Líquido</h4>
            <div style={styles.saldoFinalValue}>
              {formatMoeda(totals.saldoLiquido)}
            </div>
            <div style={styles.saldoStatus}>
              {totals.saldoLiquido > 0 ? '✅ Superávit' : totals.saldoLiquido < 0 ? '❌ Déficit' : '⚖️ Equilibrado'}
            </div>
          </div>
        </div>
      </section>

      {/* Salários */}
      <section style={styles.section}>
        <h3 style={styles.h3Big}>Salários</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table as any}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Salário Bruto</th>
                <th style={styles.th}>INSS</th>
                <th style={styles.th}>IRRF</th>
                <th style={styles.th}>Outros</th>
                <th style={styles.th}>Salário Líquido</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {salarios.map((sal, idx) => (
                <tr key={sal.id} style={idx % 2 === 0 ? styles.trAlt : undefined}>
                  <td style={{ 
                    color: '#111827', 
                    fontWeight: 700,
                    ...(sal.nome.includes('INSS') ? { color: '#1d4ed8', background: '#eff6ff' } : {})
                  }}>
                    {sal.nome}
                  </td>
                  <td>
                    <input style={styles.inputNum} type="number" step="0.01" value={sal.salarioBruto === 0 ? '' : sal.salarioBruto}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSalarios(arr => arr.map((it, i) => i === idx ? { ...it, salarioBruto: v } : it));
                      }} />
                  </td>
                  <td>
                    <input style={styles.inputNum} type="number" step="0.01" value={sal.descontos.inss === 0 ? '' : sal.descontos.inss}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSalarios(arr => arr.map((it, i) => i === idx ? { ...it, descontos: { ...it.descontos, inss: v } } : it));
                      }} />
                  </td>
                  <td>
                    <input style={styles.inputNum} type="number" step="0.01" value={sal.descontos.irrf === 0 ? '' : sal.descontos.irrf}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSalarios(arr => arr.map((it, i) => i === idx ? { ...it, descontos: { ...it.descontos, irrf: v } } : it));
                      }} />
                  </td>
                  <td>
                    <input style={styles.inputNum} type="number" step="0.01" value={sal.descontos.outros === 0 ? '' : sal.descontos.outros}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSalarios(arr => arr.map((it, i) => i === idx ? { ...it, descontos: { ...it.descontos, outros: v } } : it));
                      }} />
                  </td>
                  <td style={{...styles.rightStrong, ...styles.money}}>{formatMoeda(sal.salarioLiquido)}</td>
                  <td style={{textAlign:'center'}}>
                    <label style={styles.pill}>
                      <input type="checkbox" checked={sal.pago} onChange={(e) => setSalarios(arr => arr.map((it, i) => i === idx ? { ...it, pago: e.target.checked } : it))} />
                      <span style={{ marginLeft: 6 }}>{sal.pago ? 'Pago' : 'Pendente'}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ color: '#111827', fontWeight: 800 }}>Total</td>
                <td style={{ ...styles.money, color: '#111827', fontWeight: 800 }}>{formatMoeda(salarios.reduce((s, sal) => s + sal.salarioBruto, 0))}</td>
                <td style={{ ...styles.money, color: '#111827', fontWeight: 800 }}>{formatMoeda(salarios.reduce((s, sal) => s + sal.descontos.inss, 0))}</td>
                <td style={{ ...styles.money, color: '#111827', fontWeight: 800 }}>{formatMoeda(salarios.reduce((s, sal) => s + sal.descontos.irrf, 0))}</td>
                <td style={{ ...styles.money, color: '#111827', fontWeight: 800 }}>{formatMoeda(salarios.reduce((s, sal) => s + sal.descontos.outros, 0))}</td>
                <td style={{ ...styles.money, color: '#1d4ed8', fontWeight: 900 }}>{formatMoeda(totals.totalSalariosLiquidos)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Destaque para Salário INSS */}
        <div style={styles.inssHighlight}>
          <h4 style={styles.inssHighlightTitle}>💰 Salário INSS da Eliete</h4>
          <p style={styles.inssHighlightText}>
            Aposentadoria/benefício do INSS é registrado separadamente para controle específico.
          </p>
        </div>
      </section>

      {/* Recebíveis Empresa */}
      <section style={styles.section}>
        <h3 style={styles.h3Big}>Recebíveis da Empresa</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table as any}>
            <thead>
              <tr>
                <th style={styles.th}>Descrição</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {recebiveisEmpresa.map((rec, idx) => (
                <tr key={rec.id} style={idx % 2 === 0 ? styles.trAlt : undefined}>
                  <td style={{ color: '#111827', fontWeight: 700 }}>{rec.descricao}</td>
                  <td>
                    <input style={styles.inputNum} type="number" step="0.01" value={rec.valor === 0 ? '' : rec.valor}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setRecebiveisEmpresa(arr => arr.map((it, i) => i === idx ? { ...it, valor: v } : it));
                      }} />
                  </td>
                  <td>
                    <input style={styles.inputDate} type="date" value={rec.data}
                      onChange={(e) => setRecebiveisEmpresa(arr => arr.map((it, i) => i === idx ? { ...it, data: e.target.value } : it))} />
                  </td>
                  <td style={{textAlign:'center'}}>
                    <label style={styles.pill}>
                      <input type="checkbox" checked={rec.pago} onChange={(e) => setRecebiveisEmpresa(arr => arr.map((it, i) => i === idx ? { ...it, pago: e.target.checked } : it))} />
                      <span style={{ marginLeft: 6 }}>{rec.pago ? 'Recebido' : 'Pendente'}</span>
                    </label>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button style={styles.danger} onClick={() => setRecebiveisEmpresa(arr => arr.filter((_, i) => i !== idx))}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ color: '#111827', fontWeight: 800 }}>Total</td>
                <td style={{ ...styles.money, color: '#10b981', fontWeight: 900 }}>{formatMoeda(totals.totalRecebiveisEmpresa)}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div>
          <button style={styles.secondary} onClick={() => setRecebiveisEmpresa(arr => [...arr, { id: Date.now().toString(), descricao: '', valor: 0, data: '', pago: false }])}>Adicionar Recebível</button>
        </div>
      </section>

      {/* INSS Empresa */}
      <section style={styles.section}>
        <h3 style={styles.h3Big}>INSS Empresa</h3>
        <div style={styles.inssCard}>
          <div style={styles.inssRow}>
            <label style={styles.label}>Valor do INSS:</label>
            <input style={styles.inputNum} type="number" step="0.01" value={inssEmpresa.valor === 0 ? '' : inssEmpresa.valor}
              onChange={(e) => setInssEmpresa(prev => ({ ...prev, valor: Number(e.target.value) || 0 }))} />
          </div>
          <div style={styles.inssRow}>
            <label style={styles.label}>Data de Vencimento:</label>
            <input style={styles.inputDate} type="date" value={inssEmpresa.vencimento}
              onChange={(e) => setInssEmpresa(prev => ({ ...prev, vencimento: e.target.value }))} />
          </div>
          <div style={styles.inssRow}>
            <label style={styles.label}>Status:</label>
            <label style={styles.pill}>
              <input type="checkbox" checked={inssEmpresa.pago} onChange={(e) => setInssEmpresa(prev => ({ ...prev, pago: e.target.checked }))} />
              <span style={{ marginLeft: 6 }}>{inssEmpresa.pago ? 'Pago' : 'Pendente'}</span>
            </label>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section style={styles.section}>
        <h3 style={styles.h3Big}>Dashboard Recebíveis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ height: 300 }}>
            <h4 style={styles.blockTitle}>Distribuição de Salários</h4>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie dataKey="value" data={chartData.distribuicaoSalarios} outerRadius={80} innerRadius={20}>
                    {chartData.distribuicaoSalarios.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ height: 300 }}>
            <h4 style={styles.blockTitle}>Recebíveis da Empresa</h4>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.recebiveisEmpresa} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <YAxis tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ height: 300 }}>
            <h4 style={styles.blockTitle}>Evolução Mensal</h4>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.evolucaoMensal} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="mes" tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <YAxis tick={{ fill: '#111827', fontSize: 12 }} stroke="#e5e7eb" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="salarios" stroke="#3b82f6" strokeWidth={2} name="Salários" />
                  <Line type="monotone" dataKey="empresa" stroke="#10b981" strokeWidth={2} name="Empresa" />
                  <Line type="monotone" dataKey="inss" stroke="#ef4444" strokeWidth={2} name="INSS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Calculadora removida */}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; warning?: boolean }> = ({ label, value, warning }) => (
  <div style={{ ...styles.metric, ...(warning ? styles.metricWarn : {}) }}>
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
  danger: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  section: { background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' },
  h3Big: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#111827', textTransform: 'uppercase' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { background: '#f8fafc', padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' },
  trAlt: { background: '#f8fafc' },
  inputNum: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a' },
  inputDate: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a' },
  right: { textAlign: 'right' },
  rightStrong: { textAlign: 'right', color: '#111827', fontWeight: 800 },
  pill: { display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#ffffff', color: '#111827' },
  money: { fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  metric: { background: '#ffffff', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' },
  metricWarn: { borderColor: '#ef4444', background: '#fef2f2' },
  metricLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 700, color: '#111827' },
  blockTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' },
  inssCard: { background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' },
  inssRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  label: { minWidth: 120, fontWeight: 600, color: '#374151' },
  aside: { position: 'fixed', top: 20, right: 20, zIndex: 1000 },
  saldoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  saldoCard: { background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' },
  saldoCardFinal: { background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: 20, borderRadius: 12, color: '#ffffff' },
  saldoTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#111827' },
  saldoTitleFinal: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#ffffff' },
  saldoItem: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 },
  saldoValue: { fontWeight: 600, color: '#10b981' },
  saldoValueNegative: { fontWeight: 600, color: '#ef4444' },
  saldoTotal: { display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb', fontWeight: 700 },
  saldoTotalValue: { fontWeight: 800, color: '#10b981', fontSize: 16 },
  saldoTotalValueNegative: { fontWeight: 800, color: '#ef4444', fontSize: 16 },
  saldoFinalValue: { fontSize: 24, fontWeight: 900, marginBottom: 8 },
  saldoStatus: { fontSize: 14, fontWeight: 600, opacity: 0.9 },
  inssHighlight: { background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', padding: 16, borderRadius: 8, border: '1px solid #3b82f6', marginTop: 16 },
  inssHighlightTitle: { fontSize: 16, fontWeight: 700, color: '#1e40af', marginBottom: 8 },
  inssHighlightText: { fontSize: 14, color: '#1e40af', margin: 0 }
};
