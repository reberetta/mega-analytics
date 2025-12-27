import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, ReferenceLine, LabelList
} from 'recharts';
import { Trophy, Activity, Sigma, Hash, Filter, Info, Flame, Binary } from 'lucide-react';
import rawData from './mega_sena_data.json';

const COLORS = {
  primary: '#6366f1',
  secondary: '#ec4899',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  chart: ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#a78bfa']
};

// Componente de Tooltip customizada para explicar os gráficos
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-lg">
        <p className="font-bold text-slate-800">{`${prefix} ${label}`}</p>
        <p className="text-indigo-600">{`${payload[0].value} ocorrências`}</p>
        {payload[0].payload.percent && (
          <p className="text-xs text-slate-400">{`${payload[0].payload.percent}% da história`}</p>
        )}
      </div>
    );
  }
  return null;
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
      {title}
    </h2>
    <p className="text-slate-500 max-w-2xl">{subtitle}</p>
  </div>
);

export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);

  const filteredData = useMemo(() => {
    return rawData.filter(game => filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true);
  }, [filterVirada]);

  // --- CÁLCULOS E ESTATÍSTICAS ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const distSoma = {};
    const distPrimos = {};
    const distFib = {};
    const distAssinatura = {};
    
    filteredData.forEach(g => {
      // Soma (Buckets de 10)
      const bSoma = Math.floor(g.analises.soma / 10) * 10;
      distSoma[bSoma] = (distSoma[bSoma] || 0) + 1;
      
      // Primos e Fib
      distPrimos[g.analises.primos] = (distPrimos[g.analises.primos] || 0) + 1;
      distFib[g.analises.fibonacci] = (distFib[g.analises.fibonacci] || 0) + 1;
      
      // Assinatura
      const sig = g.analises.quadrantes.assinatura;
      distAssinatura[sig] = (distAssinatura[sig] || 0) + 1;
    });

    const format = (obj) => Object.entries(obj).map(([name, value]) => ({ 
      name, 
      value, 
      percent: ((value / total) * 100).toFixed(1) 
    })).sort((a, b) => Number(a.name) - Number(b.name));

    return {
      soma: format(distSoma),
      primos: format(distPrimos),
      fib: format(distFib),
      assinatura: format(distAssinatura).sort((a,b) => b.value - a.value).slice(0, 5),
      total
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 font-sans">
      {/* HEADER REGINA */}
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* INTRODUÇÃO E INSIGHT PRINCIPAL */}
        <div className="bg-indigo-900 rounded-3xl p-8 mb-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-indigo-200">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-4">A Ciência da Sorte</h2>
            <p className="text-indigo-100 leading-relaxed">
              Analisamos <b>{stats.total}</b> concursos históricos para separar o mito da realidade. 
              Na Mega Sena, a sorte tem um padrão. Não apostamos para adivinhar o futuro, mas para 
              não jogar em combinações que a matemática já provou serem quase impossíveis.
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

        {/* SECTION 1: SOMA E CURVA DE SINO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-1">
            <SectionHeader 
              title="A Curva de Sino" 
              subtitle="Por que você não deve jogar 01-02-03-04-05-06? Porque a soma seria 21. Os dados mostram que a grande maioria dos sorteios acumula uma soma central entre 160 e 200."
            />
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex gap-3 items-start">
                <Info className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-tight">
                  <b>Dica:</b> Se a soma do seu jogo for menor que 100 ou maior que 250, você está apostando em uma "zebra" que acontece em menos de 5% da história.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.soma}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 10}} label={{ value: 'Soma Total', position: 'insideBottom', offset: -5 }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip prefix="Soma na casa dos" />} />
                <ReferenceLine x="160" stroke="#10b981" strokeDasharray="3 3" label={{value: 'Início Ouro', fill: '#10b981', fontSize: 10}} />
                <ReferenceLine x="200" stroke="#10b981" strokeDasharray="3 3" label={{value: 'Fim Ouro', fill: '#10b981', fontSize: 10}} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={0.1} fill="#6366f1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 2: PRIMOS E FIBONACCI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><Binary size={24}/></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Números Primos</h3>
                <p className="text-sm text-slate-400">Quantidade de primos por sorteio</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.primos}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} label={{ value: 'Qtd de Primos', position: 'insideBottom', offset: -5 }} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Bar dataKey="value" fill="#fbbf24" radius={[6, 6, 0, 0]}>
                    {stats.primos.map((entry, index) => (
                      <Cell key={index} fill={entry.name === "1" || entry.name === "2" ? COLORS.primary : "#e2e8f0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded-lg italic">
              <b>Insight da Regina:</b> 66% dos jogos contêm apenas 1 ou 2 primos. Evite jogos com 4 ou mais; eles são raridades matemáticas.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-50 rounded-2xl text-green-600"><Flame size={24}/></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Sequência Fibonacci</h3>
                <p className="text-sm text-slate-400">Números (1, 2, 3, 5, 8, 13, 21, 34, 55)</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.fib}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} label={{ value: 'Qtd Fibonacci', position: 'insideBottom', offset: -5 }} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Bar dataKey="value" fill="#34d399" radius={[6, 6, 0, 0]}>
                     {stats.fib.map((entry, index) => (
                      <Cell key={index} fill={entry.name === "0" || entry.name === "1" ? COLORS.accent : "#e2e8f0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded-lg italic">
              <b>Análise:</b> Em 78% das vezes, o sorteio tem 0 ou no máximo 1 número da sequência de Fibonacci.
            </p>
          </div>
        </div>

        {/* SECTION 3: O GRANDE INSIGHT DOS QUADRANTES */}
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 mb-16">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3">
              <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">O Caos <br/><span className="text-indigo-600">Dominante</span></h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Nossa intuição busca equilíbrio (2-2-1-1), mas os dados revelam que o padrão <b>3-2-1-0</b> é o verdadeiro campeão. 
                <br/><br/>
                Isso prova que <b>deixar um quadrante vazio</b> não é erro, é probabilidade.
              </p>
              <div className="space-y-4">
                {stats.assinatura.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-sm font-bold text-slate-600">{item.name}</span>
                    <div className="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all" style={{width: `${item.percent}%`}} />
                    </div>
                    <span className="text-xs font-black text-indigo-600">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-2/3 bg-slate-900 rounded-3xl p-8 text-white">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="border-r border-b border-white/10 p-4 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-2">Q1</span>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">3</div>
                </div>
                <div className="border-b border-white/10 p-4 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-2">Q2</span>
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/50">2</div>
                </div>
                <div className="border-r border-white/10 p-4 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-2">Q3</span>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">1</div>
                </div>
                <div className="p-4 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-2">Q4 (Vazio)</span>
                  <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center border border-slate-500/50 text-slate-500">0</div>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-500 mt-6 uppercase tracking-widest">Exemplo da Assinatura Campeã 3-2-1-0</p>
            </div>
          </div>
        </div>

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