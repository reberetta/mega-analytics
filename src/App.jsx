import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { Activity, Info, Flame, Binary, LayoutGrid } from 'lucide-react';
import rawData from './mega_sena_data.json';

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
 * [GRÁFICO 1] CURVA DE SINO (SOMA)
 * =================================================================================
 */
const ChartSoma = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      <div className="lg:col-span-1">
        <SectionHeader 
          title="A Curva de Sino" 
          subtitle="A soma das 6 dezenas quase sempre cai no centro. Jogos extremos (soma < 120 ou > 240) são estatisticamente raros."
          icon={Info}
          colorClass="text-indigo-900"
        />
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-800 leading-relaxed">
            <b>Dica Estratégica:</b> Some seus números antes de jogar. Se o total der <b>entre 160 e 200</b>, você está na "Zona de Ouro" onde ocorrem a maioria dos sorteios.
          </p>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{fontSize: 10}} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip prefix="Soma total:" />} />
            {/* Linhas de Referência para a Zona de Ouro */}
            <ReferenceLine x="160" stroke="#10b981" strokeDasharray="3 3" label={{value: 'Início Ouro', fill: '#10b981', fontSize: 10, position: 'insideTopLeft'}} />
            <ReferenceLine x="200" stroke="#10b981" strokeDasharray="3 3" label={{value: 'Fim Ouro', fill: '#10b981', fontSize: 10, position: 'insideTopRight'}} />
            <Area type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={3} fillOpacity={0.1} fill={COLORS.primary} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/** * =================================================================================
 * [GRÁFICO 2] PRIMOS E FIBONACCI
 * =================================================================================
 */
const ChartPrimosFib = ({ dataPrimos, dataFib }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
      {/* Bloco Primos */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><Binary size={24}/></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Números Primos</h3>
            <p className="text-sm text-slate-400">Quantidade ideal por jogo</p>
          </div>
        </div>
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPrimos}>
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <Tooltip content={<CustomTooltip prefix="Qtd:" />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataPrimos.map((entry, index) => (
                  <Cell key={index} fill={(entry.name === "1" || entry.name === "2") ? COLORS.primary : "#e2e8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded-lg">
          <b>Insight:</b> 66% dos resultados históricos têm apenas <b>1 ou 2 números primos</b>.
        </p>
      </div>

      {/* Bloco Fibonacci */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-50 rounded-2xl text-green-600"><Flame size={24}/></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Fibonacci</h3>
            <p className="text-sm text-slate-400">Sequência: 1, 2, 3, 5, 8, 13, 21, 34, 55</p>
          </div>
        </div>
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataFib}>
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <Tooltip content={<CustomTooltip prefix="Qtd:" />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dataFib.map((entry, index) => (
                  <Cell key={index} fill={(entry.name === "0" || entry.name === "1") ? COLORS.accent : "#e2e8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded-lg">
          <b>Insight:</b> Raramente saem mais de 2 números Fibonacci. O padrão é <b>0 ou 1</b>.
        </p>
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
          <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">O Caos <br/><span className="text-indigo-600">Dominante</span></h3>
          <p className="text-slate-500 mb-6 leading-relaxed text-sm">
            Nossa intuição busca equilíbrio (2-2-1-1), mas os dados mostram que o padrão <b>3-2-1-0</b> é o campeão. <br/>
            Isso prova que <b>deixar um quadrante vazio</b> não é erro, é probabilidade.
          </p>
          <div className="space-y-4">
            {dataAssinatura.map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-xs font-bold text-slate-600 w-16">{item.name}</span>
                <div className="flex-1 mx-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all" style={{width: `${item.percent}%`}} />
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
    });

    // Função auxiliar para formatar array de gráficos
    const format = (obj) => Object.entries(obj).map(([name, value]) => ({ 
      name, 
      value, 
      percent: ((value / total) * 100).toFixed(1) 
    })).sort((a, b) => Number(a.name) - Number(b.name));

    return {
      soma: format(distSoma),
      primos: format(distPrimos),
      fib: format(distFib),
      assinatura: format(distAssinatura).sort((a,b) => b.value - a.value).slice(0, 5), // Top 5
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
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                filterVirada ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:border-indigo-200'
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
        
        {/* BLOCO INTRODUTÓRIO */}
        <div className="bg-indigo-900 rounded-3xl p-8 mb-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-indigo-200">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-4">A Ciência da Sorte</h2>
            <p className="text-indigo-100 leading-relaxed">
              Analisamos <b>{stats.total}</b> concursos históricos. Na Mega Sena, a sorte tem um padrão. Não apostamos para adivinhar o futuro, mas para não jogar em combinações que a matemática já provou serem "zebras".
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center">
              <p className="text-xs uppercase tracking-widest text-indigo-300 mb-1">Intervalo de Ouro</p>
              <p className="text-4xl font-black">160-200</p>
              <p className="text-[10px] text-indigo-200 mt-2">SOMA DAS DEZENAS</p>
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