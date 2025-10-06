import { useState, useEffect } from 'react';

// Tipos para dados compartilhados
export interface GastosFixos {
  categoria: string;
  valor: number;
  pago: boolean;
}

export interface GastosVariaveis {
  descricao: string;
  data: string;
  aguiar: number;
  bardela: number;
}

export interface Salario {
  id: string;
  nome: string;
  salarioBruto: number;
  descontos: {
    inss: number;
    irrf: number;
    outros: number;
  };
  salarioLiquido: number;
  pago: boolean;
}

export interface RecebivelEmpresa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  pago: boolean;
}

export interface InssEmpresa {
  valor: number;
  pago: boolean;
  vencimento: string;
}

// Hook para dados compartilhados
export const useSharedData = () => {
  const [gastosFixos, setGastosFixos] = useState<GastosFixos[]>([
    { categoria: 'Empregada', valor: 1700, pago: false },
    { categoria: 'Carro', valor: 1030, pago: false },
    { categoria: 'Combustível', valor: 500, pago: false },
    { categoria: 'Alimentação Miguel', valor: 400, pago: false },
    { categoria: 'Segurança', valor: 300, pago: false },
    { categoria: 'Colégio', valor: 800, pago: false },
    { categoria: 'Psicóloga', valor: 600, pago: false },
    { categoria: 'Psicóloga (adicional)', valor: 200, pago: false },
    { categoria: 'Futebol', valor: 150, pago: false },
    { categoria: 'Cinema', valor: 100, pago: false },
    { categoria: 'Seguro', valor: 200, pago: false },
    { categoria: 'Água', valor: 150, pago: false },
    { categoria: 'Luz', valor: 200, pago: false },
    { categoria: 'Revisão do Carro', valor: 300, pago: false }
  ]);

  const [gastosVariaveis, setGastosVariaveis] = useState<GastosVariaveis[]>([]);

  const [salarios, setSalarios] = useState<Salario[]>([
    { id: '1', nome: 'Adjalma', salarioBruto: 0, descontos: { inss: 0, irrf: 0, outros: 0 }, salarioLiquido: 0, pago: false },
    { id: '2', nome: 'Eliete', salarioBruto: 0, descontos: { inss: 0, irrf: 0, outros: 0 }, salarioLiquido: 0, pago: false },
    { id: '3', nome: 'Eliete (INSS)', salarioBruto: 0, descontos: { inss: 0, irrf: 0, outros: 0 }, salarioLiquido: 0, pago: false }
  ]);

  const [recebiveisEmpresa, setRecebiveisEmpresa] = useState<RecebivelEmpresa[]>([
    { id: '1', descricao: 'Faturamento Principal', valor: 0, data: '', pago: false },
    { id: '2', descricao: 'Serviços Adicionais', valor: 0, data: '', pago: false },
    { id: '3', descricao: 'Consultoria', valor: 0, data: '', pago: false }
  ]);

  const [inssEmpresa, setInssEmpresa] = useState<InssEmpresa>({
    valor: 0,
    pago: false,
    vencimento: ''
  });

  // Cálculos automáticos de salário líquido
  useEffect(() => {
    setSalarios(prev => prev.map(s => {
      const totalDescontos = s.descontos.inss + s.descontos.irrf + s.descontos.outros;
      return { ...s, salarioLiquido: Math.max(0, s.salarioBruto - totalDescontos) };
    }));
  }, [salarios]);

  // Função para calcular totais
  const calcularTotais = () => {
    const totalGastosFixos = gastosFixos.reduce((s, g) => s + g.valor, 0);
    const totalGastosVariaveis = gastosVariaveis.reduce((s, g) => s + g.aguiar + g.bardela, 0);
    const totalSalariosLiquidos = salarios.reduce((s, sal) => s + sal.salarioLiquido, 0);
    const totalRecebiveisEmpresa = recebiveisEmpresa.reduce((s, rec) => s + rec.valor, 0);
    const totalInssEmpresa = inssEmpresa.valor;
    
    const receitaTotal = totalSalariosLiquidos + totalRecebiveisEmpresa - totalInssEmpresa;
    const despesaTotal = totalGastosFixos + totalGastosVariaveis;
    const saldoLiquido = receitaTotal - despesaTotal;

    return {
      receitaTotal,
      despesaTotal,
      saldoLiquido,
      totalGastosFixos,
      totalGastosVariaveis,
      totalSalariosLiquidos,
      totalRecebiveisEmpresa,
      totalInssEmpresa
    };
  };

  return {
    // Dados
    gastosFixos,
    setGastosFixos,
    gastosVariaveis,
    setGastosVariaveis,
    salarios,
    setSalarios,
    recebiveisEmpresa,
    setRecebiveisEmpresa,
    inssEmpresa,
    setInssEmpresa,
    
    // Cálculos
    calcularTotais
  };
};
