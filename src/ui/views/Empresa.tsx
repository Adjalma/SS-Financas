import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { loadMonthData } from '../../lib/supabase';
import { getSupabase } from '../../lib/supabase';

type Entry = {
  id?: number;
  month: string;
  type: 'revenue' | 'expense';
  category?: string;
  costCenter?: string;
  description: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  paid: boolean;
};

export const Empresa: React.FC = () => {
  const [mes, setMes] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState<Entry>({ month: new Date().toISOString().slice(0, 7), type: 'expense', description: '', date: new Date().toISOString().slice(0,10), amount: 0, paid: false });

  const totals = useMemo(() => {
    const rev = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.amount, 0);
    const exp = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { revenue: rev, expense: exp, balance: rev - exp };
  }, [entries]);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (sb) {
        await sb.from('months').upsert({ year_month: mes }, { onConflict: 'year_month' }).throwOnError();
        const { data: monthRow } = await sb.from('months').select('*').eq('year_month', mes).single();
        const monthId = monthRow.id;
        const { data } = await sb.from('company_entries').select(`id, type, description, date, amount, paid, payment_method, categories(name), cost_centers(name)`).eq('month_id', monthId).order('date', { ascending: true });
        const mapped: Entry[] = (data || []).map((r: any) => ({ id: r.id, month: mes, type: r.type, category: r.categories?.name || '', costCenter: r.cost_centers?.name || '', description: r.description, date: r.date, amount: Number(r.amount) || 0, paymentMethod: r.payment_method || '', paid: !!r.paid }));
        if (mapped.length > 0) {
          setEntries(mapped);
          return;
        }
      }
      // Removido fallback que misturava dados pessoais na Empresa
      setEntries([]);
    })();
  }, [mes]);

  const saveEmpresa = async () => {
    try {
      const sb = getSupabase();
      if (!sb) {
        localStorage.setItem(`empresa_${mes}`, JSON.stringify(entries));
        alert('Dados da Empresa salvos localmente. Configure o Supabase para salvar em nuvem.');
        return;
      }
      await sb.from('months').upsert({ year_month: mes }, { onConflict: 'year_month' }).throwOnError();
      const { data: monthRow } = await sb.from('months').select('*').eq('year_month', mes).single();
      const monthId = monthRow.id;

      // Upsert categorias e centros de custo distintos
      const distinctCategories = Array.from(new Set(entries.map(e => e.category).filter(Boolean))) as string[];
      const distinctCostCenters = Array.from(new Set(entries.map(e => e.costCenter).filter(Boolean))) as string[];

      const catIdMap = new Map<string, number>();
      for (const name of distinctCategories) {
        const { data } = await sb.from('categories').upsert({ name }).select('id').single();
        if (data?.id) catIdMap.set(name, data.id);
      }
      const ccIdMap = new Map<string, number>();
      for (const name of distinctCostCenters) {
        const { data } = await sb.from('cost_centers').upsert({ name }).select('id').single();
        if (data?.id) ccIdMap.set(name, data.id);
      }

      // Limpa lançamentos do mês e insere novamente
      let r = await sb.from('company_entries').delete().eq('month_id', monthId);
      if (r.error) throw r.error;
      if (entries.length) {
        const { error } = await sb.from('company_entries').insert(
          entries.map(e => ({
            month_id: monthId,
            type: e.type,
            category_id: e.category ? catIdMap.get(e.category) ?? null : null,
            cost_center_id: e.costCenter ? ccIdMap.get(e.costCenter) ?? null : null,
            description: e.description,
            date: e.date,
            amount: e.amount,
            payment_method: e.paymentMethod || null,
            paid: e.paid,
          }))
        );
        if (error) throw error;
      }
      alert('Dados da Empresa salvos com sucesso.');
    } catch (err) {
      console.error(err);
      alert(`Falha ao salvar dados da Empresa: ${(err as any)?.message || 'Erro'}`);
    }
  };

  const addEntry = async () => {
    // Validação mínima de formulário
    if (!form.description || !form.date || !(Number(form.amount) > 0)) {
      alert('Preencha Descrição, Data e Valor (> 0).');
      return;
    }
    const sb = getSupabase();
    if (!sb) { setEntries((arr) => [...arr, form]); return; }
    await sb.from('months').upsert({ year_month: mes }).throwOnError();
    const { data: monthRow } = await sb.from('months').select('*').eq('year_month', mes).single();
    const monthId = monthRow.id;
    let categoryId: number | null = null;
    let costCenterId: number | null = null;
    if (form.category && form.category.trim()) {
      const { data: cat } = await sb.from('categories').upsert({ name: form.category }).select('id').single();
      categoryId = cat?.id || null;
    }
    if (form.costCenter && form.costCenter.trim()) {
      const { data: cc } = await sb.from('cost_centers').upsert({ name: form.costCenter }).select('id').single();
      costCenterId = cc?.id || null;
    }
    await sb.from('company_entries').insert({ month_id: monthId, type: form.type, category_id: categoryId, cost_center_id: costCenterId, description: form.description, date: form.date, amount: form.amount, payment_method: form.paymentMethod || null, paid: form.paid }).throwOnError();
    setForm({ ...form, description: '', amount: 0 });
    // reload
    const { data } = await sb.from('company_entries').select(`id, type, description, date, amount, paid, payment_method, categories(name), cost_centers(name)`).eq('month_id', monthId).order('date', { ascending: true });
    const mapped: Entry[] = (data || []).map((r: any) => ({ id: r.id, month: mes, type: r.type, category: r.categories?.name || '', costCenter: r.cost_centers?.name || '', description: r.description, date: r.date, amount: Number(r.amount) || 0, paymentMethod: r.payment_method || '', paid: !!r.paid }));
    setEntries(mapped);
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.title}>Sistema Sentinela - Empresa</div>
          <div style={styles.subtitle}>Fluxo de caixa mensal</div>
        </div>
        <div style={styles.topbarRight}>
          <input style={styles.month} type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
          <button style={styles.primary} onClick={saveEmpresa}>Salvar Dados</button>
        </div>
      </div>
      <h3 style={styles.h3}>Dashboard Principal</h3>
      <div style={styles.cards}>
        <Metric label="Receitas" value={formatMoeda(totals.revenue)} />
        <Metric label="Despesas" value={formatMoeda(totals.expense)} />
        <Metric label="Saldo" value={formatMoeda(totals.balance)} />
      </div>

      <section style={styles.section}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 16 }}>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Meses com Maiores Despesas</h4>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={monthsLargestExpenses(entries)} layout="vertical">
                <XAxis type="number" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" width={80} />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Finanças Pessoais</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <KpiSmall label="Ticket médio" value={formatMoeda(totals.revenue && totals.expense ? (totals.expense/Math.max(1, entries.filter(e=>e.type==='expense').length)) : 0)} />
              <KpiSmall label="% Despesa/Receita" value={(totals.revenue? (totals.expense/totals.revenue*100):0).toFixed(1) + '%'} />
              <KpiSmall label="Lançamentos" value={String(entries.length)} />
            </div>
          </div>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Evolução das Despesas</h4>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={evolutionByMonth(entries.filter(e=>e.type==='expense'))}>
                <XAxis dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <YAxis tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: 16, marginTop: 16 }}>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Meta de Investimento</h4>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie dataKey="value" data={investmentGoalData(totals)} innerRadius={50} outerRadius={80}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Top 5 Despesas</h4>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={topExpenses(entries)}>
                <XAxis dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <YAxis tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <Tooltip />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 220 }}>
            <h4 style={styles.blockTitle}>Evolução dos Lucros</h4>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={evolutionProfit(entries)}>
                <XAxis dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <YAxis tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.h3}>Novo Lançamento</h3>
        <div style={styles.grid6}>
          <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <input style={styles.input} placeholder="Categoria" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input style={styles.input} placeholder="Centro de Custo" value={form.costCenter || ''} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
          <input style={styles.input} placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input style={styles.input} type="number" step="0.01" placeholder="Valor" value={form.amount === 0 ? '' : form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} />
          <input style={styles.input} placeholder="Pagamento (ex: PIX)" value={form.paymentMethod || ''} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
          <label style={styles.inline}><input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} /> Pago</label>
          <div />
          <button style={styles.primary} onClick={addEntry}>Adicionar</button>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.h3}>Lançamentos</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table as any}>
            <thead>
              <tr>
                <th>Data</th><th>Tipo</th><th>Categoria</th><th>Centro Custo</th><th>Descrição</th><th>Valor</th><th>Pago</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id || Math.random()}>
                  <td>{e.date}</td>
                  <td>{e.type === 'revenue' ? 'Receita' : 'Despesa'}</td>
                  <td>{e.category || '-'}</td>
                  <td>{e.costCenter || '-'}</td>
                  <td>{e.description}</td>
                  <td style={{textAlign:'right'}}>{formatMoeda(e.amount)}</td>
                  <td style={{textAlign:'center'}}>{e.paid ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.h3}>Gestão de Cartões</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateByCategory(entries.filter(e=>e.type==='expense'))}>
                <XAxis dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <YAxis tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <Tooltip />
                <Bar dataKey="amount" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="amount" data={aggregateByType(entries)} outerRadius={90}>
                  {aggregateByType(entries).map((d, i) => (<Cell key={d.name} fill={chartColors[i % chartColors.length]} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.h3}>Análise de Gastos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateByCategory(entries)}>
                <XAxis dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <YAxis tick={{ fill: '#111827' }} stroke="#e5e7eb" />
                <Tooltip />
                <Bar dataKey="amount" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="amount" data={aggregateByType(entries)} outerRadius={90}>
                  {aggregateByType(entries).map((d, i) => (<Cell key={d.name} fill={chartColors[i % chartColors.length]} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ height: 260, marginTop: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceSeries(entries)}>
              <XAxis dataKey="name" tick={{ fill: '#111827' }} stroke="#e5e7eb" />
              <YAxis tick={{ fill: '#111827' }} stroke="#e5e7eb" />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Calculadora removida */}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={styles.metric}>
    <div style={styles.metricLabel}>{label}</div>
    <div style={styles.metricValue}>{value}</div>
  </div>
);

const KpiSmall: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, background: '#ffffff' }}>
    <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{value}</div>
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
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  metric: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#ffffff' },
  metricLabel: { fontSize: 12, color: '#6b7280' },
  metricValue: { fontSize: 28, fontWeight: 800, color: '#111827' },
  section: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#ffffff' },
  h3: { margin: 0, marginBottom: 12, fontSize: 16 },
  grid6: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, alignItems: 'center' },
  input: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' },
  inline: { display: 'flex', alignItems: 'center', gap: 6, color: '#374151' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  blockTitle: { margin: 0, fontSize: 13, color: '#6b7280', marginBottom: 6 },
};

function formatMoeda(n: number): string {
  return 'R$ ' + (n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function aggregateByCategory(entries: Entry[]) {
  const map = new Map<string, number>();
  for (const e of entries) {
    const key = e.category || '—';
    map.set(key, (map.get(key) || 0) + e.amount * (e.type === 'expense' ? 1 : 0));
  }
  return Array.from(map, ([name, amount]) => ({ name, amount }));
}

function aggregateByType(entries: Entry[]) {
  const rev = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + e.amount, 0);
  const exp = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  return [{ name: 'Receita', amount: rev }, { name: 'Despesa', amount: exp }];
}

function balanceSeries(entries: Entry[]) {
  // série simples por dia do mês
  const map = new Map<string, number>();
  for (const e of entries) {
    const d = e.date;
    const v = e.type === 'revenue' ? e.amount : -e.amount;
    map.set(d, (map.get(d) || 0) + v);
  }
  let acc = 0;
  return Array.from([...map.entries()].sort(([a],[b]) => a.localeCompare(b))).map(([name, v]) => { acc += v; return { name, balance: acc }; });
}

const chartColors = ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f87171','#2dd4bf','#c4b5fd'];

function monthsLargestExpenses(entries: Entry[]) {
  const map = new Map<string, number>();
  for (const e of entries.filter(e=>e.type==='expense')) {
    const m = e.date.slice(0,7);
    map.set(m, (map.get(m)||0) + e.amount);
  }
  return Array.from(map, ([name, amount]) => ({ name, amount })).sort((a,b)=>b.amount-a.amount).slice(0,6);
}

function evolutionByMonth(entries: Entry[]) {
  const map = new Map<string, number>();
  for (const e of entries) {
    const m = e.date.slice(0,7);
    map.set(m, (map.get(m)||0) + e.amount);
  }
  return Array.from(map, ([name, amount]) => ({ name, amount })).sort((a,b)=>a.name.localeCompare(b.name));
}

function topExpenses(entries: Entry[]) {
  const map = new Map<string, number>();
  for (const e of entries.filter(e=>e.type==='expense')) {
    const key = e.category || '—';
    map.set(key, (map.get(key)||0) + e.amount);
  }
  return Array.from(map, ([name, amount]) => ({ name, amount })).sort((a,b)=>b.amount-a.amount).slice(0,5);
}

function evolutionProfit(entries: Entry[]) {
  const map = new Map<string, { rev: number; exp: number }>();
  for (const e of entries) {
    const m = e.date.slice(0,7);
    const cur = map.get(m) || { rev: 0, exp: 0 };
    if (e.type==='revenue') cur.rev += e.amount; else cur.exp += e.amount;
    map.set(m, cur);
  }
  return Array.from(map, ([name, v]) => ({ name, profit: v.rev - v.exp })).sort((a,b)=>a.name.localeCompare(b.name));
}

function investmentGoalData(totals: { revenue: number; expense: number; balance: number }) {
  const goalPct = totals.revenue ? Math.max(0, Math.min(1, totals.balance / totals.revenue)) : 0;
  return [{ name: 'Atingido', value: +(goalPct*100).toFixed(1) }, { name: 'Restante', value: +((1-goalPct)*100).toFixed(1) }];
}


