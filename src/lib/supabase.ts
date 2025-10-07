import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) return null;
  if (!client) client = createClient(url, anon);
  return client;
}

export type MonthPayload = {
  mes: string; // YYYY-MM
  gastosFixos: Array<{ categoria: string; valor: number; pago: boolean }>;
  cartoes: { aguiar: number; bardela: number };
  gastosExtras: Array<{ descricao: string; data: string; aguiar: number; bardela: number }>;
};

export async function saveMonthData(payload: MonthPayload): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    localStorage.setItem(`gastosFamilia_${payload.mes}`, JSON.stringify(payload));
    return;
  }
      await sb.from('months').upsert({ year_month: payload.mes }, { onConflict: 'year_month' }).throwOnError();
  const { data: monthRow } = await sb.from('months').select('*').eq('year_month', payload.mes).single();
  const monthId = monthRow.id;

      // FIXOS: atualiza por (month_id, category)
      if (payload.gastosFixos.length) {
        await sb
          .from('fixed_costs')
          .upsert(
            payload.gastosFixos.map(g => ({ month_id: monthId, category: g.categoria, amount: g.valor, paid: g.pago })),
            { onConflict: 'month_id,category' }
          )
          .throwOnError();
      }

      // VARIÁVEIS: para evitar chave falsa, mantemos estratégia delete+insert (sem constraint)
      await sb.from('variable_expenses').delete().eq('month_id', monthId).throwOnError();
      if (payload.gastosExtras.length) {
        await sb
          .from('variable_expenses')
          .insert(
            payload.gastosExtras.map(e => ({ month_id: monthId, description: e.descricao, date: e.data || null, aguiar_amount: e.aguiar, bardela_amount: e.bardela }))
          )
          .throwOnError();
      }

      // CARTÕES: atualiza por (month_id, owner)
      await sb
        .from('cards')
        .upsert(
          [
            { month_id: monthId, owner: 'Aguiar', amount: payload.cartoes.aguiar },
            { month_id: monthId, owner: 'Bardela', amount: payload.cartoes.bardela },
          ],
          { onConflict: 'month_id,owner' }
        )
        .throwOnError();
}

export async function loadMonthData(mes: string): Promise<MonthPayload | null> {
  const sb = getSupabase();
  if (!sb) {
    const raw = localStorage.getItem(`gastosFamilia_${mes}`);
    return raw ? (JSON.parse(raw) as MonthPayload) : null;
  }
  const { data: monthRow } = await sb.from('months').select('*').eq('year_month', mes).maybeSingle();
  if (!monthRow) return null;
  const monthId = monthRow.id;
  const [{ data: fixed }, { data: vars }, { data: cards }] = await Promise.all([
    sb.from('fixed_costs').select('*').eq('month_id', monthId),
    sb.from('variable_expenses').select('*').eq('month_id', monthId),
    sb.from('cards').select('*').eq('month_id', monthId),
  ]);
  return {
    mes,
    gastosFixos: (fixed || []).map((r: any) => ({ categoria: r.category, valor: Number(r.amount) || 0, pago: !!r.paid })),
    cartoes: {
      aguiar: Number((cards || []).find((c: any) => c.owner === 'Aguiar')?.amount) || 0,
      bardela: Number((cards || []).find((c: any) => c.owner === 'Bardela')?.amount) || 0,
    },
    gastosExtras: (vars || []).map((v: any) => ({ descricao: v.description || '', data: v.date || '', aguiar: Number(v.aguiar_amount) || 0, bardela: Number(v.bardela_amount) || 0 })),
  };
}

// ============================
// Holerite - Load
// ============================
export async function loadHoleriteData(mes: string): Promise<{
  salarios: Array<{ id?: string; nome: string; salarioBruto: number; descontos: { inss: number; irrf: number; outros: number }; salarioLiquido: number; pago: boolean }>;
  recebiveisEmpresa: Array<{ id?: string; descricao: string; valor: number; data: string; pago: boolean }>;
  inssEmpresa: { valor: number; vencimento?: string; dataVencimento?: string; pago: boolean };
} | null> {
  const sb = getSupabase();
  if (!sb) {
    const raw = localStorage.getItem(`holerite_${mes}`);
    if (!raw) return null;
    return JSON.parse(raw);
  }
  const { data: monthRow } = await sb.from('months').select('*').eq('year_month', mes).maybeSingle();
  if (!monthRow) return null;
  const monthId = monthRow.id;
  const [{ data: sal }, { data: rec }, { data: taxes }] = await Promise.all([
    sb.from('salaries').select('*').eq('month_id', monthId),
    sb.from('company_receivables').select('*').eq('month_id', monthId),
    sb.from('company_taxes').select('*').eq('month_id', monthId).eq('tax_type', 'inss'),
  ]);
  const salarios = (sal || []).map((s: any) => ({
    id: String(s.id),
    nome: s.employee_name,
    salarioBruto: Number(s.gross_salary) || 0,
    descontos: { inss: Number(s.inss_deduction) || 0, irrf: Number(s.irrf_deduction) || 0, outros: Number(s.other_deductions) || 0 },
    salarioLiquido: Number(s.net_salary) || (Number(s.gross_salary)||0) - (Number(s.inss_deduction)||0) - (Number(s.irrf_deduction)||0) - (Number(s.other_deductions)||0),
    pago: !!s.paid,
  }));
  const recebiveisEmpresa = (rec || []).map((r: any) => ({ id: String(r.id), descricao: r.description || '', valor: Number(r.amount) || 0, data: r.due_date || '', pago: !!r.received }));
  const tax = (taxes || [])[0];
  const inssEmpresa = { valor: Number(tax?.amount) || 0, vencimento: tax?.due_date || '', dataVencimento: tax?.due_date || '', pago: !!tax?.paid };
  return { salarios, recebiveisEmpresa, inssEmpresa };
}


