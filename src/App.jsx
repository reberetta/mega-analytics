import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { Activity, Info, Flame, Binary, LayoutGrid } from 'lucide-react';
import rawData from './mega_sena_data.json';
import { Trophy, Activity, Sigma, Hash, Filter, Info, Flame, Binary, LayoutGrid, Sparkles } from 'lucide-react';

/** * =================================================================================
 * CONFIGURAÇÕES GERAIS (CORES E TEMAS)
 * =================================================================================
 */
const COLORS = {
  primary: '#6366f1',   // Indigo
  secondary: '#ec4899', // Pink
  accent: '#10b981',    // Emerald
  warning: '#f59e0b',   // Amber
  slate: '#64748b',
  chart: ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#a78bfa']
};

/** * =================================================================================
 * COMPONENTES DE UI (TOOLTIPS, HEADERS, CARDS)
 * =================================================================================
 */

// Tooltip customizado para os gráficos
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-lg text-sm">
        <p className="font-bold text-slate-800">{`${prefix} ${label}`}</p>
        <p className="text-indigo-600 font-semibold">{`${payload[0].value} ocorrências`}</p>
        {payload[0].payload.percent && (
          <p className="text-xs text-slate-400 mt-1">{`${payload[0].payload.percent}% da história`}</p>
        )}
      </div>
    );
  }
  return null;
};

// Cabeçalho de cada seção
const SectionHeader = ({ title, subtitle, icon: Icon, colorClass = "text-slate-800" }) => (
  <div className="mb-6">
    <h2 className={`text-2xl font-bold ${colorClass} flex items-center gap-2`}>
      {Icon && <Icon size={24} />}
      {title}
    </h2>
    <p className="text-slate-500 max-w-2xl mt-1">{subtitle}</p>
  </div>
);

/** * =================================================================================
 * [GRÁFICO 1] CURVA DE SINO (SOMA) COM DESVIOS PADRÕES
 * =================================================================================
 */
const ChartSoma = ({ data }) => {
  // Configurações Estatísticas da Mega Sena (Baseadas na teoria + histórico)
  const MEDIA = 183;
  const DESVIO_PADRAO = 40; // Aproximado para facilitar a visualização de intervalos redondos

  // Faixas (Range)
  const SIGMA_1_MIN = MEDIA - DESVIO_PADRAO; // 143
  const SIGMA_1_MAX = MEDIA + DESVIO_PADRAO; // 223

  const SIGMA_2_MIN = MEDIA - (2 * DESVIO_PADRAO); // 103
  const SIGMA_2_MAX = MEDIA + (2 * DESVIO_PADRAO); // 263

  // Função para calcular a % real dos dados atuais dentro de um range
  const calculatePercent = (min, max) => {
    if (!data || data.length === 0) return 0;

    // Total de jogos no dataset atual
    const totalGames = data.reduce((acc, item) => acc + item.value, 0);

    // Jogos dentro do range
    const gamesInRange = data.reduce((acc, item) => {
      const soma = Number(item.name); // O 'name' é a soma (ex: 180)
      if (soma >= min && soma <= max) return acc + item.value;
      return acc;
    }, 0);

    return ((gamesInRange / totalGames) * 100).toFixed(1);
  };

  const pctSigma1 = calculatePercent(SIGMA_1_MIN, SIGMA_1_MAX); // Esperado ~68%
  const pctSigma2 = calculatePercent(SIGMA_2_MIN, SIGMA_2_MAX); // Esperado ~95%

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      <div className="lg:col-span-1">
        <SectionHeader
          title="A Curva Normal (Sigma)"
          subtitle="Aplicamos a regra dos Desvios Padrões (σ) para identificar as zonas de segurança."
          icon={Sigma}
          colorClass="text-indigo-900"
        />

        {/* Legenda das Zonas */}
        <div className="space-y-3 mt-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Zona Segura (1σ)</span>
              <span className="text-sm font-black text-emerald-700">{pctSigma1}%</span>
            </div>
            <p className="text-xs text-emerald-600 leading-tight">
              Somas entre <b>{SIGMA_1_MIN} e {SIGMA_1_MAX}</b>. É onde a grande maioria dos sorteios acontece.
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Zona de Alerta (2σ)</span>
              <span className="text-sm font-black text-amber-700">{pctSigma2}%</span>
            </div>
            <p className="text-xs text-amber-600 leading-tight">
              Somas entre <b>{SIGMA_2_MIN} e {SIGMA_2_MAX}</b>. Jogos aqui são possíveis, mas menos frequentes.
            </p>
          </div>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 opacity-70">
            <p className="text-xs text-rose-800 leading-tight">
              <b>Zona de Risco (>3σ):</b> Somas abaixo de {SIGMA_2_MIN} ou acima de {SIGMA_2_MAX} representam menos de 5% da história. São as famosas "zebras".
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSoma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} minTickGap={20} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip prefix="Soma:" />} />

            {/* ZONA 2 SIGMA (Amarelo - Fundo) */}
            <ReferenceArea
              x1={SIGMA_2_MIN}
              x2={SIGMA_2_MAX}
              fill="#fcd34d"
              fillOpacity={0.15}
              ifOverflow="extendDomain"
            />

            {/* ZONA 1 SIGMA (Verde - Miolo) */}
            <ReferenceArea
              x1={SIGMA_1_MIN}
              x2={SIGMA_1_MAX}
              fill="#10b981"
              fillOpacity={0.2}
              ifOverflow="extendDomain"
            />

            {/* Labels no topo do gráfico para indicar as faixas */}
            <ReferenceLine x={SIGMA_1_MIN} stroke="#10b981" strokeDasharray="2 2" />
            <ReferenceLine x={SIGMA_1_MAX} stroke="#10b981" strokeDasharray="2 2" />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#colorSoma)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Eixo X: Soma total das dezenas | Áreas coloridas representam desvios padrões (Probabilidade)
        </p>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO] PRIMOS E FIBONACCI
 * =================================================================================
 */
const ChartPrimosFib = ({ dataPrimos, dataFib }) => {
  // Cores locais para este bloco
  const COLOR_PRIMOS = '#f59e0b'; // Amber (Amarelo Queimado)
  const COLOR_FIB = '#10b981';    // Emerald (Verde)
  const COLOR_MUTED = '#e2e8f0';  // Cinza Claro para as "zebras"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

      {/* --- BLOCO NÚMEROS PRIMOS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Binary size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Números Primos</h3>
            <p className="text-sm text-slate-400">Quantidade de primos por sorteio</p>
          </div>
        </div>

        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPrimos}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 shadow-lg border border-slate-100 rounded-lg text-sm">
                        <p className="font-bold text-slate-800">Qtd: {label}</p>
                        <p className="text-amber-600 font-semibold">{payload[0].value} jogos</p>
                        <p className="text-xs text-slate-400">{payload[0].payload.percent}% do total</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataPrimos.map((entry, index) => (
                  <Cell
                    key={index}
                    // Destaque para 1 ou 2 Primos (que são a maioria)
                    fill={(entry.name === "1" || entry.name === "2") ? COLOR_PRIMOS : COLOR_MUTED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-900 leading-relaxed">
            <b>Insight da Regina:</b> A matemática mostra que <b>66% dos jogos</b> contêm apenas 1 ou 2 números primos.
            Jogos com 4 ou mais primos são raridades estatísticas.
          </p>
        </div>
      </div>

      {/* --- BLOCO FIBONACCI --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Fibonacci</h3>
            <p className="text-sm text-slate-400">Sequência: 1, 2, 3, 5, 8, 13, 21, 34, 55</p>
          </div>
        </div>

        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataFib}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 shadow-lg border border-slate-100 rounded-lg text-sm">
                        <p className="font-bold text-slate-800">Qtd: {label}</p>
                        <p className="text-emerald-600 font-semibold">{payload[0].value} jogos</p>
                        <p className="text-xs text-slate-400">{payload[0].payload.percent}% do total</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataFib.map((entry, index) => (
                  <Cell
                    key={index}
                    // Destaque para 0 ou 1 Fibonacci (Maioria)
                    fill={(entry.name === "0" || entry.name === "1") ? COLOR_FIB : COLOR_MUTED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <p className="text-xs text-emerald-900 leading-relaxed">
            <b>Análise:</b> Em <b>78% das vezes</b>, o sorteio tem 0 ou no máximo 1 número da sequência de Fibonacci.
            Apostar em 3 ou mais números dessa sequência reduz drasticamente suas chances.
          </p>
        </div>
      </div>

    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO] EQUILÍBRIO PAR / ÍMPAR (HISTOGRAMA)
 * =================================================================================
 */
const ChartParImpar = ({ data, probSegura }) => {
  // Configuração de cores semânticas
  const COLOR_SAFE = '#6366f1';   // Indigo (Equilíbrio Ideal)
  const COLOR_RISK = '#94a3b8';   // Slate (Extremos/Zebras)

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        
        {/* Lado Esquerdo: Texto e KPI */}
        <div className="lg:w-1/3">
          <SectionHeader 
            title="Equilíbrio Par/Ímpar" 
            subtitle="A batalha entre Pares e Ímpares quase sempre termina em empate técnico."
            icon={Hash} // Importar de lucide-react
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

        {/* Lado Direito: Gráfico de Distribuição */}
        <div className="lg:w-2/3 w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}P / ${6-val}Í`} // Exibe "2P / 4Í" no eixo
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const pares = label;
                    const impares = 6 - Number(label);
                    return (
                      <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-xl text-sm">
                        <p className="font-bold text-slate-800 mb-1">{pares} Pares e {impares} Ímpares</p>
                        <div className="flex justify-between gap-4 text-slate-500 text-xs">
                          <span>Ocorrências:</span>
                          <span className="font-mono font-bold text-indigo-600">{payload[0].value}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-500 text-xs">
                          <span>Frequência:</span>
                          <span className="font-mono font-bold text-indigo-600">{payload[0].payload.percent}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                {data.map((entry, index) => {
                  // Destaca apenas 2, 3 e 4 (Índices da barra ou pelo nome)
                  const n = Number(entry.name);
                  const isSafe = n >= 2 && n <= 4;
                  return (
                    <Cell 
                      key={index} 
                      fill={isSafe ? COLOR_SAFE : COLOR_RISK} 
                      fillOpacity={isSafe ? 1 : 0.3} // Deixa os extremos mais "apagados"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest">
            Quantidade de Números Pares no Sorteio
          </p>
        </div>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 3] QUADRANTES (COM VISUALIZAÇÃO DO VOLANTE)
 * =================================================================================
 */
const ChartQuadrantes = ({ dataAssinatura }) => {
  // Função auxiliar para desenhar o volantezinho
  const renderMiniVolante = () => {
    // Definição dos quadrantes
    const getQuad = (n) => {
      if (n <= 30) return (n % 10 >= 1 && n % 10 <= 5) ? 1 : 2; // Linhas de cima
      return (n % 10 >= 1 && n % 10 <= 5) ? 3 : 4; // Linhas de baixo
    };

    // Ajuste fino para múltiplos de 10 (ex: 10, 20, 30...)
    const getQuadAdjusted = (n) => {
      // Coluna 0 (10, 20...) pertence ao lado direito (Q2 ou Q4)
      if (n % 10 === 0) return n <= 30 ? 2 : 4;
      return getQuad(n);
    };

    const colors = { 1: 'bg-indigo-500', 2: 'bg-pink-500', 3: 'bg-emerald-500', 4: 'bg-slate-500' };

    return (
      <div className="grid grid-cols-10 gap-1 p-4 bg-slate-800 rounded-xl mt-4 w-full max-w-sm mx-auto">
        {Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
          const q = getQuadAdjusted(num);
          return (
            <div key={num} className={`aspect-square rounded-[2px] flex items-center justify-center text-[7px] font-bold text-white/90 ${colors[q]}`}>
              {num}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 mb-16">
      <div className="flex flex-col lg:flex-row gap-12">

        {/* Lado Esquerdo: Texto e Barras */}
        <div className="lg:w-1/3">
          <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">O Caos <br /><span className="text-indigo-600">Dominante</span></h3>
          <p className="text-slate-500 mb-6 leading-relaxed text-sm">
            Nossa intuição busca equilíbrio (2-2-1-1), mas os dados mostram que o padrão <b>3-2-1-0</b> é o campeão. <br />
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

        {/* Lado Direito: Explicação Visual dos Quadrantes */}
        <div className="lg:w-2/3 bg-slate-900 rounded-3xl p-8 text-white flex flex-col items-center">
          <div className="flex gap-4 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Q1</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-pink-500 rounded-full"></div> Q2</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Q3</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-500 rounded-full"></div> Q4</span>
          </div>

          {renderMiniVolante()}

          <p className="text-center text-[10px] text-slate-500 mt-6 max-w-md">
            O volante acima mostra visualmente como os 60 números são divididos. Note como é comum um sorteio concentrar muitos pontos em uma cor (quadrante) e ignorar outra completamente.
          </p>
        </div>
      </div>
    </div>
  );
};


/** * =================================================================================
 * COMPONENTE PRINCIPAL (DASHBOARD)
 * =================================================================================
 */
export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);

  // --- FILTRAGEM ---
  const filteredData = useMemo(() => {
    return rawData.filter(game => filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true);
  }, [filterVirada]);

  // --- CÁLCULOS GERAIS (HOOK UNIFICADO) ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const distSoma = {};
    const distPrimos = {};
    const distFib = {};
    const distAssinatura = {};
    const distPares = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // Inicializa zerado

    filteredData.forEach(g => {
      // Soma (Agrupada de 10 em 10)
      const bSoma = Math.floor(g.analises.soma / 10) * 10;
      distSoma[bSoma] = (distSoma[bSoma] || 0) + 1;

      // Primos e Fib
      distPrimos[g.analises.primos] = (distPrimos[g.analises.primos] || 0) + 1;
      distFib[g.analises.fibonacci] = (distFib[g.analises.fibonacci] || 0) + 1;

      // Assinatura (Quadrantes)
      const sig = g.analises.quadrantes.assinatura;
      distAssinatura[sig] = (distAssinatura[sig] || 0) + 1;

      // Pares (assumindo que g.analises.pares já vem do JSON)
      const qtdPares = g.analises.pares;
      if (distPares[qtdPares] !== undefined) {
        distPares[qtdPares]++;
      }
    });

    // Função auxiliar para formatar array de gráficos
    const format = (obj) => Object.entries(obj).map(([name, value]) => ({
      name,
      value,
      percent: ((value / total) * 100).toFixed(1)
    })).sort((a, b) => Number(a.name) - Number(b.name));

    // Formata para o gráfico
    const formatPares = Object.entries(distPares).map(([name, value]) => ({
      name, // "0", "1", "2"...
      value,
      percent: ((value / total) * 100).toFixed(1)
    }));

    // Calcula a probabilidade do "Grupo Seguro" (2, 3 ou 4 pares)
    const totalSeguro = (distPares[2] || 0) + (distPares[3] || 0) + (distPares[4] || 0);
    const probSegura = ((totalSeguro / total) * 100).toFixed(1);

    return {
      soma: format(distSoma),
      primos: format(distPrimos),
      fib: format(distFib),
      assinatura: format(distAssinatura).sort((a, b) => b.value - a.value).slice(0, 5), // Top 5
      pares: formatPares,
      probPares: probSegura, // Para usar no texto
      total
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 font-sans">

      {/* --- HEADER --- */}
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

      {/* --- CONTEÚDO --- */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* INTRODUÇÃO: O CONCEITO */}
        <div className="bg-indigo-900 rounded-3xl p-10 mb-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">

          {/* Elemento decorativo de fundo (Textura) */}
          <div className="absolute top-0 right-0 opacity-5 transform translate-x-12 -translate-y-12 pointer-events-none">
            <Binary size={300} />
          </div>

          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-400/30">
                <Sparkles size={24} className="text-amber-300" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                O Padrão Oculto na Aleatoriedade
              </h2>
            </div>

            <div className="space-y-4 text-indigo-50 text-lg leading-relaxed">
              <p>
                Muitos acreditam que a loteria é puramente sorte. Matematicamente, o número 01 tem a mesma chance de sair que o 60.
                Porém, quando olhamos para o <b>conjunto dos 6 números</b>, a história muda.
              </p>
              <p>
                A Lei dos Grandes Números nos mostra que os resultados tendem a seguir uma curva de distribuição normal (Sino).
                Neste dashboard, analisamos <b>{stats.total} concursos</b> para separar o que é "Comum" do que é "Estatisticamente Improvável".
              </p>
              <p className="font-semibold text-white pt-2 border-l-4 border-indigo-500 pl-4">
                Não tentamos adivinhar o futuro, mas sim ajudar você a montar jogos que respeitam a matemática,
                evitando combinações (zebras) que raramente acontecem.
              </p>
            </div>
          </div>
        </div>

        {/* --- INSERÇÃO DOS GRÁFICOS MODULARES --- */}

        {/* 1. Curva de Soma */}
        <ChartSoma data={stats.soma} />

        {/* 2. Primos e Fibonacci */}
        <ChartPrimosFib dataPrimos={stats.primos} dataFib={stats.fib} />

        {/* 3. Quadrantes e Volante Visual */}
        <ChartQuadrantes dataAssinatura={stats.assinatura} />

      </main>

      {/* --- FOOTER --- */}
      <footer className="max-w-7xl mx-auto px-6 border-t border-slate-100 pt-10 text-center">
        <p className="text-sm text-slate-400">
          Dados atualizados até Concurso {filteredData[0]?.concurso} • Dashboard by
          <a href="https://reberetta.com.br" className="text-indigo-600 font-bold ml-1 hover:underline">Regina Beretta</a>
        </p>
      </footer>
    </div>
  );
}