import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, ReferenceLine, ReferenceArea, Label // <--- ADICIONEI O LABEL AQUI
} from 'recharts';
import {
  Activity, Info, Flame, Binary, Sparkles, Hash, Sigma, Grid3X3, LayoutGrid
} from 'lucide-react';
import rawData from './mega_sena_data.json';

/** * =================================================================================
 * CONFIGURAÇÕES GERAIS
 * =================================================================================
 */
const COLORS = {
  primary: '#6366f1',   // Indigo
  secondary: '#ec4899', // Pink
  accent: '#10b981',    // Emerald
  warning: '#f59e0b',   // Amber
  slate: '#64748b',
  risk: '#94a3b8'       // Cinza Risco
};

/** * =================================================================================
 * COMPONENTES DE UI
 * =================================================================================
 */
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-lg text-sm">
        <p className="font-bold text-slate-800">{prefix} {label}</p>
        <p className="text-indigo-600 font-semibold">{payload[0].value} ocorrências</p>
        {payload[0].payload.percent && (
          <p className="text-xs text-slate-400 mt-1">{payload[0].payload.percent}% da história</p>
        )}
      </div>
    );
  }
  return null;
};

const SectionHeader = ({ title, subtitle, icon: Icon, colorClass = "text-slate-800" }) => (
  <div className="mb-6">
    <h2 className={`text-2xl font-bold ${colorClass} flex items-center gap-2`}>
      {Icon && <Icon size={24} />}
      {title}
    </h2>
    <p className="text-slate-500 max-w-2xl mt-1 text-sm">{subtitle}</p>
  </div>
);

/** * =================================================================================
 * [GRÁFICO 1] SOMA COM SIGMA (DESVIO PADRÃO)
 * =================================================================================
 */
const ChartSoma = ({ data }) => {
  // Constantes Estatísticas da Mega Sena
  const MEDIA = 183;
  const SIGMA_1_MIN = 143;
  const SIGMA_1_MAX = 223;
  const SIGMA_2_MIN = 103;
  const SIGMA_2_MAX = 263;

  // Ticks para forçar o Eixo X a mostrar exatamente esses números
  const boundaryTicks = [SIGMA_2_MIN, SIGMA_1_MIN, MEDIA, SIGMA_1_MAX, SIGMA_2_MAX];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 border-b border-slate-100 pb-16">
      <div className="lg:col-span-1">
        <SectionHeader
          title="A Curva Normal (Sigma)"
          subtitle="Visualize instantaneamente onde está a segurança matemática do jogo."
          icon={Sigma}
          colorClass="text-indigo-900"
        />
        <div className="space-y-4 mt-6">
          {/* Legenda Lateral Auxiliar */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Zona Segura (68.2%)</span>
              <p className="text-[10px] text-slate-400">Entre {SIGMA_1_MIN} e {SIGMA_1_MAX}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Zona de Alerta (13.6%)</span>
              <p className="text-[10px] text-slate-400">Entre {SIGMA_2_MIN}-{SIGMA_1_MIN} e {SIGMA_1_MAX}-{SIGMA_2_MAX}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500"></div>
            <div>
              <span className="text-xs font-bold text-slate-700">Zona de Risco (2.1%)</span>
              <p className="text-[10px] text-slate-400">Abaixo de {SIGMA_2_MIN} ou acima de {SIGMA_2_MAX}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorSoma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            {/* Eixo X configurado para mostrar os limites exatos */}
            <XAxis
              dataKey="name"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={boundaryTicks}
              tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }}
              tickFormatter={(val) => val}
              interval={0}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip prefix="Soma:" />} />

            {/* --- ÁREAS DE FUNDO COLORIDAS (ZONAS) --- */}

            {/* 1. ZONA EXTREMA (Esquerda) - Risco */}
            <ReferenceArea x1={0} x2={SIGMA_2_MIN} fill="#f43f5e" fillOpacity={0.08}>
              <Label value="2.1%" position="insideBottom" fill="#f43f5e" fontSize={12} fontWeight="bold" offset={10} />
            </ReferenceArea>

            {/* 2. ZONA INTERMEDIÁRIA (Esquerda) - Alerta */}
            <ReferenceArea x1={SIGMA_2_MIN} x2={SIGMA_1_MIN} fill="#f59e0b" fillOpacity={0.12}>
              <Label value="13.6%" position="center" fill="#d97706" fontSize={12} fontWeight="bold" />
            </ReferenceArea>

            {/* 3. ZONA CENTRAL (Média) - Segura */}
            <ReferenceArea x1={SIGMA_1_MIN} x2={SIGMA_1_MAX} fill="#10b981" fillOpacity={0.15}>
              <Label value="68.2%" position="top" fill="#059669" fontSize={16} fontWeight="900" dy={20} />
            </ReferenceArea>

            {/* 4. ZONA INTERMEDIÁRIA (Direita) - Alerta */}
            <ReferenceArea x1={SIGMA_1_MAX} x2={SIGMA_2_MAX} fill="#f59e0b" fillOpacity={0.12}>
              <Label value="13.6%" position="center" fill="#d97706" fontSize={12} fontWeight="bold" />
            </ReferenceArea>

            {/* 5. ZONA EXTREMA (Direita) - Risco */}
            <ReferenceArea x1={SIGMA_2_MAX} x2={400} fill="#f43f5e" fillOpacity={0.08}>
              <Label value="2.1%" position="insideBottom" fill="#f43f5e" fontSize={12} fontWeight="bold" offset={10} />
            </ReferenceArea>

            {/* Linhas verticais para marcar os limites exatos */}
            <ReferenceLine x={MEDIA} stroke="#6366f1" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine x={SIGMA_1_MIN} stroke="#10b981" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_1_MAX} stroke="#10b981" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_2_MIN} stroke="#f59e0b" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_2_MAX} stroke="#f59e0b" strokeDasharray="2 2" />

            {/* O Gráfico de Dados por cima de tudo */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#colorSoma)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 2] PAR / ÍMPAR (HISTOGRAMA)
 * =================================================================================
 */
const ChartParImpar = ({ data, probSegura }) => {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="lg:w-1/3">
          <SectionHeader
            title="Equilíbrio Par/Ímpar"
            subtitle="A batalha entre Pares e Ímpares quase sempre termina em empate técnico."
            icon={Hash}
          />
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-4">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Zona de Segurança</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-indigo-600">{probSegura}%</span>
              <span className="text-sm font-bold text-indigo-500">dos jogos</span>
            </div>
            <p className="text-sm text-indigo-800 leading-snug">
              Têm uma distribuição equilibrada de <b>2, 3 ou 4</b> números pares.
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-6 italic">
            * Apostar em 6 pares ou 6 ímpares é jogar contra a estatística (acontece em menos de 2% dos casos).
          </p>
        </div>
        <div className="lg:w-2/3 w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}P / ${6 - val}Í`}
              />
              <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip prefix="Configuração:" />} />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                {data.map((entry, index) => {
                  const n = Number(entry.name);
                  const isSafe = n >= 2 && n <= 4;
                  return <Cell key={index} fill={isSafe ? COLORS.primary : COLORS.risk} fillOpacity={isSafe ? 1 : 0.3} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Quantidade de Números Pares</p>
        </div>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 3] PRIMOS E FIBONACCI
 * =================================================================================
 */
const ChartPrimosFib = ({ dataPrimos, dataFib }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 border-b border-slate-100 pb-16">
      {/* --- CARTÃO PRIMOS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Binary size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Primos</h3>
            <p className="text-sm text-slate-400">Valores: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59.</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPrimos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={<CustomTooltip prefix="Qtd Primos:" />}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataPrimos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry.name === "1" || entry.name === "2") ? COLORS.warning : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-amber-800 mt-6 bg-amber-50 p-3 rounded-lg border border-amber-100">
          <b>Insight:</b> 66% dos resultados têm apenas <b>1 ou 2 primos</b>.
        </p>
      </div>

      {/* --- CARTÃO FIBONACCI --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Fibonacci</h3>
            <p className="text-sm text-slate-400">Sequência: 1, 2, 3, 5, 8, 13...</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataFib} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={<CustomTooltip prefix="Qtd Fibonacci:" />}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataFib.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry.name === "0" || entry.name === "1") ? COLORS.accent : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-emerald-800 mt-6 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
          <b>Insight:</b> O padrão dominante é ter <b>0 ou 1</b> número Fibonacci.
        </p>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 4] QUADRANTES COM VOLANTE
 * =================================================================================
 */
const ChartQuadrantes = ({ dataAssinatura }) => {
  const renderMiniVolante = () => {
    const getQuad = (n) => {
      if (n % 10 === 0) return n <= 30 ? 2 : 4;
      if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2;
      return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4;
    };
    const colors = { 1: 'bg-indigo-500', 2: 'bg-pink-500', 3: 'bg-emerald-500', 4: 'bg-slate-500' };
    return (
      <div className="grid grid-cols-10 gap-1 p-4 bg-slate-800 rounded-xl mt-4 w-full max-w-sm mx-auto">
        {Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
          <div key={num} className={`aspect-square rounded-[2px] flex items-center justify-center text-[7px] font-bold text-white/90 ${colors[getQuad(num)]}`}>{num}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/3">
          <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">O Caos <br /><span className="text-indigo-600">Dominante</span></h3>
          <p className="text-slate-500 mb-6 leading-relaxed text-sm">
            Nossa intuição busca equilíbrio (2-2-1-1), mas os dados mostram que o padrão <b>3-2-1-0</b> é o campeão.
            Isso prova que <b>deixar um quadrante vazio</b> não é erro, é probabilidade.
          </p>
          <div className="space-y-4">
            {dataAssinatura.map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-xs font-bold text-slate-600 w-16">{item.name}</span>
                <div className="flex-1 mx-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="text-xs font-black text-indigo-600 w-8 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-2/3 bg-slate-900 rounded-3xl p-8 text-white flex flex-col items-center">
          <div className="flex gap-4 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Q1</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-pink-500 rounded-full"></div> Q2</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Q3</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-500 rounded-full"></div> Q4</span>
          </div>
          {renderMiniVolante()}
          <p className="text-center text-[10px] text-slate-500 mt-6 max-w-md">
            O volante acima mostra como os 60 números são divididos. É comum concentrar muitos pontos em uma cor e ignorar outra.
          </p>
        </div>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 5] LINHAS E COLUNAS VAZIAS (NOVO)
 * =================================================================================
 */
const ChartLinhasColunas = ({ dataLines, dataCols }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 border-b border-slate-100 pb-16">

      {/* --- LINHAS VAZIAS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Linhas Vazias</h3>
            <p className="text-sm text-slate-400">Quantas linhas ficaram sem nenhum número?</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataLines} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val} Vazias`}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip prefix="Linhas Vazias:" />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataLines.map((entry, index) => {
                  // O padrão ouro é 1 ou 2 linhas vazias
                  const isSafe = entry.name === "1" || entry.name === "2";
                  return <Cell key={`cell-${index}`} fill={isSafe ? COLORS.primary : "#cbd5e1"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-indigo-800 mt-6 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
          <b>Insight:</b> É matematicamente difícil preencher todas as linhas. O normal é ter <b>1 ou 2 linhas totalmente vazias</b>.
        </p>
      </div>

      {/* --- COLUNAS VAZIAS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pink-50 rounded-2xl text-pink-600">
            <Grid3X3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Colunas Vazias</h3>
            <p className="text-sm text-slate-400">Das 10 colunas, quantas não foram usadas?</p>
          </div>
        </div>

        <div className="w-full h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataCols} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val} Vazias`}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip prefix="Colunas Vazias:" />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataCols.map((entry, index) => {
                  // O padrão ouro é 4 ou 5 colunas vazias
                  const isSafe = entry.name === "4" || entry.name === "5";
                  return <Cell key={`cell-${index}`} fill={isSafe ? COLORS.secondary : "#cbd5e1"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-pink-800 mt-6 bg-pink-50 p-3 rounded-lg border border-pink-100">
          <b>Insight:</b> Com apenas 6 números, você sempre terá colunas vazias. O ideal é ter <b>4 ou 5 vazias</b>.
        </p>
      </div>

    </div>
  );
};

/** * =================================================================================
 * [MAIN] DASHBOARD PRINCIPAL
 * =================================================================================
 */
export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);

  const filteredData = useMemo(() => {
    // Garante que rawData existe antes de filtrar
    if (!rawData) return [];
    return rawData.filter(game => filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true);
  }, [filterVirada]);

  // --- ENGINE DE CÁLCULOS ---
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { soma: [], primos: [], fib: [], assinatura: [], pares: [], lines: [], cols: [], probPares: 0, total: 0 };
    }

    const total = filteredData.length;
    const distSoma = {};
    const distPrimos = {};
    const distFib = {};
    const distAssinatura = {};
    const distPares = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    // NOVOS ACUMULADORES
    const distLines = {};
    const distCols = {};

    filteredData.forEach(g => {
      // 1. Soma
      const bSoma = Math.floor(g.analises.soma / 10) * 10;
      distSoma[bSoma] = (distSoma[bSoma] || 0) + 1;

      // 2. Primos/Fib/Assinatura (Usando seus dados prontos)
      distPrimos[g.analises.primos] = (distPrimos[g.analises.primos] || 0) + 1;
      distFib[g.analises.fibonacci] = (distFib[g.analises.fibonacci] || 0) + 1;
      distAssinatura[g.analises.quadrantes.assinatura] = (distAssinatura[g.analises.quadrantes.assinatura] || 0) + 1;

      // 3. Pares
      const p = g.analises.pares;
      if (distPares[p] !== undefined) distPares[p]++;

      // 4. LINHAS E COLUNAS (LENDO DIRETO DO JSON)
      const lv = g.analises.linhas_vazias;
      distLines[lv] = (distLines[lv] || 0) + 1;

      const cv = g.analises.colunas_vazias;
      distCols[cv] = (distCols[cv] || 0) + 1;
    });

    const format = (obj) => Object.entries(obj).map(([name, value]) => ({
      name, value, percent: ((value / total) * 100).toFixed(1)
    })).sort((a, b) => Number(a.name) - Number(b.name));

    // Cálculo Probabilidade Pares (2, 3 ou 4)
    const totalSeguro = (distPares[2] || 0) + (distPares[3] || 0) + (distPares[4] || 0);
    const probPares = ((totalSeguro / total) * 100).toFixed(1);

    return {
      soma: format(distSoma),
      primos: format(distPrimos),
      fib: format(distFib),
      assinatura: format(distAssinatura).sort((a, b) => b.value - a.value).slice(0, 5),
      pares: format(distPares),
      lines: format(distLines), // <--- Retorna processado
      cols: format(distCols),   // <--- Retorna processado
      probPares,
      total
    };
  }, [filteredData]);

  if (!rawData || rawData.length === 0) {
    return <div className="p-10 text-center text-red-500">Erro: Arquivo de dados vazio ou não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 font-sans">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl rotate-3 shadow-lg shadow-indigo-200">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">PrintFlow <span className="text-indigo-600">Analytics</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Mega Sena Data Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilterVirada(!filterVirada)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border-2 ${filterVirada ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:border-indigo-200'
                }`}
            >
              {filterVirada ? '✨ MODO VIRADA ATIVO' : 'MOSTRAR SÓ VIRADA'}
            </button>
            <div className="h-8 w-[1px] bg-slate-100 mx-2" />
            <span className="text-xs font-medium text-slate-400">Analysis by <b className="text-slate-600">Regina Beretta</b></span>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* INTRODUÇÃO */}
        <div className="bg-indigo-900 rounded-3xl p-10 mb-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 transform translate-x-12 -translate-y-12 pointer-events-none">
            <Binary size={300} />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-400/30">
                <Sparkles size={24} className="text-amber-300" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">O Padrão Oculto na Aleatoriedade</h2>
            </div>
            <div className="space-y-4 text-indigo-50 text-lg leading-relaxed">
              <p>Muitos acreditam que a loteria é puramente sorte. Porém, quando olhamos para o <b>conjunto dos 6 números</b>, a história muda.</p>
              <p>Analisamos <b>{stats.total} concursos</b>. Não tentamos adivinhar o futuro, mas sim ajudar você a montar jogos que respeitam a matemática, evitando combinações (zebras) que raramente acontecem.</p>
            </div>
          </div>
        </div>

        {/* 1. SOMA & SIGMA */}
        <ChartSoma data={stats.soma} />

        {/* 2. PAR / ÍMPAR */}
        <ChartParImpar data={stats.pares} probSegura={stats.probPares} />

        {/* 3. PRIMOS E FIBONACCI */}
        <ChartPrimosFib dataPrimos={stats.primos} dataFib={stats.fib} />

        {/* 4. LINHAS E COLUNAS (NOVO) */}
        <ChartLinhasColunas dataLines={stats.lines} dataCols={stats.cols} />

        {/* 4. QUADRANTES */}
        <ChartQuadrantes dataAssinatura={stats.assinatura} />

      </main>

      <footer className="max-w-7xl mx-auto px-6 border-t border-slate-100 pt-10 text-center">
        <p className="text-sm text-slate-400">
          Dados atualizados até Concurso {filteredData[0]?.concurso} • Dashboard by
          <a href="https://reberetta.com.br" className="text-indigo-600 font-bold ml-1 hover:underline">Regina Beretta</a>
        </p>
      </footer>
    </div>
  );
}