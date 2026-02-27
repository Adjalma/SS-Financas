# SS-Finanças 💰

Sistema completo de controle financeiro familiar e empresarial desenvolvido em React + TypeScript.

## 🚀 Funcionalidades

### 📊 **Finanças Pessoais**
- Controle de gastos fixos (50/50 entre Adjalma e Eliete)
- Gastos variáveis e extras
- Cartões de crédito
- Dashboard com gráficos e KPIs
- Calculadora flutuante

### 🏢 **Finanças Empresa**
- Dashboard principal empresarial
- Gestão de cartões corporativos
- Análise de gastos por categoria
- Fluxo de caixa
- Relatórios financeiros

### 💼 **Holerite**
- Controle de salários (Adjalma, Eliete, Eliete INSS)
- Recebíveis da empresa
- INSS empresarial
- **Saldo Líquido Familiar** integrado
- Gráficos de distribuição de receitas

## 🛠️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** CSS Modules + Recharts (gráficos)
- **Backend:** Supabase (PostgreSQL)
- **Deploy:** Vercel
- **Autenticação:** Sistema próprio com localStorage

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/SS-Finanças.git
cd SS-Finanças
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase
```bash
# Copie o arquivo de exemplo
cp env.example .env.local

# Edite .env.local com suas credenciais do Supabase
```

### 4. Configure o banco de dados
1. Acesse [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Execute o SQL do arquivo `supabase.schema.sql` no SQL Editor
4. Copie a URL e chave anon para `.env.local`

### 5. Execute o projeto
```bash
npm run dev
```

## 🔐 Login Administrador

> ⚠️ **Segurança:** As credenciais de administrador devem ser configuradas no Supabase (tabela de usuários) ou via variáveis de ambiente. **Nunca** commite senhas no repositório.

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `months` - Controle mensal
- `fixed_costs` - Gastos fixos pessoais
- `variable_expenses` - Gastos variáveis
- `cards` - Cartões de crédito
- `salaries` - Salários e benefícios
- `company_receivables` - Recebíveis empresariais
- `company_taxes` - Impostos empresariais
- `company_entries` - Entradas/saídas empresariais

## 🚀 Deploy no Vercel

### 1. Conecte ao GitHub
1. Acesse [Vercel](https://vercel.com)
2. Conecte sua conta GitHub
3. Importe o repositório SS-Finanças

### 2. Configure as variáveis de ambiente
No painel do Vercel, adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Deploy automático
O Vercel fará deploy automático a cada push na branch main.

## 📁 Estrutura do Projeto

```
src/
├── ui/
│   ├── App.tsx                 # App principal
│   ├── views/
│   │   ├── GastosPessoais.tsx # Finanças pessoais
│   │   ├── Empresa.tsx        # Finanças empresa
│   │   └── Holerite.tsx       # Controle de salários
│   └── widgets/
│       └── CalculatorInline.tsx # Calculadora flutuante
├── hooks/
│   └── useSharedData.ts       # Dados compartilhados
├── lib/
│   └── supabase.ts           # Cliente Supabase
└── theme.css                 # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview build
npm run lint     # Linter
```

## 📈 Funcionalidades Avançadas

### Integração de Dados
- **Dados compartilhados** entre todas as abas
- **Cálculos automáticos** de saldo líquido
- **Persistência mensal** no Supabase
- **Fallback localStorage** para desenvolvimento

### Visualizações
- **Gráficos de pizza** para distribuição
- **Gráficos de barras** para comparações
- **Gráficos de linha** para evolução temporal
- **KPIs dinâmicos** com cores contextuais

### Responsividade
- **Design responsivo** para desktop e mobile
- **Calculadora flutuante** arrastável
- **Tabelas com scroll** horizontal quando necessário

## 🐛 Troubleshooting

### Erro de build TypeScript
```bash
# Instale as dependências novamente
rm -rf node_modules package-lock.json
npm install
```

### Problemas com Supabase
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o SQL foi executado no Supabase
3. Teste a conexão no Supabase Dashboard

### Problemas de deploy
1. Verifique se todas as variáveis estão no Vercel
2. Confirme se o build local funciona (`npm run build`)
3. Verifique os logs no painel do Vercel

## 📝 Licença

Este projeto é privado e desenvolvido para uso específico.

## 👨‍💻 Desenvolvido por

Sistema desenvolvido com foco em:
- **Simplicidade** de uso
- **Integração completa** entre módulos
- **Visualização clara** dos dados
- **Controle total** das finanças familiares e empresariais

---

**SS-Finanças** - Controle financeiro completo e integrado 💰