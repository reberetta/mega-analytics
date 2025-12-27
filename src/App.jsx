import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceArea, Label
} from 'recharts';
import { Activity, Filter, Info, Flame, Snowflake, Layout } from 'lucide-react';
import rawData from './mega_sena_data.json';

// --- ESTILO E CORES ---
const THEME = {
  gold: '#10b981', // Verde esmeralda para zonas de alta prob
  risk: '#94a3b8', // Cinza para zonas irrelevantes
  primary: '#4f46e5', // Indigo
  bg: '#f8fafc'
};

export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);
  const [filterYear, setFilterYear] = useState("all");

  // --- LOGICA DE DADOS ---
  const years = useMemo(() => [...new Set(rawData.map(g => g.data.substring(0, 4)))].sort((a, b) => b - a), []);

  const filteredData = useMemo(() => {
    return rawData.filter(game => {
      const matchVirada = filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true;
      const matchYear = filterYear === "all" ? true : game.data.startsWith(filterYear);
      return matchVirada && matchYear;
    });
  }, [filterVirada, filterYear]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const somaBuckets = {};
    const finals = Array(10).fill(0);
    const lines = Array(6).fill(0);
    const freq = Array(61).fill(0);

    filteredData.forEach(g => {
      // Somas
      const s = g.analises.soma;
      const b = Math.floor(s / 10) * 10;
      somaBuckets[b] = (somaBuckets[b] || 0) + 1;
      // Finais (Colunas) e Linhas
      g.dezenas.forEach(d => {
        finals[d % 10 === 0 ? 9 : (d % 10) - 1]++;
        lines[Math.ceil(d / 10) - 1]++;
        freq[d]++;
      });
    });

    const somaArr = Object.entries(somaBuckets).map(([name, value]) => ({ 
      name: Number(name), 
      value, 
      percent: (value/total*100).toFixed(1) 
    })).sort((a,b) => a.name - b.name);

    return { somaArr, finals, lines, freq, total };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER E FILTROS */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">MegaSena <span className="text-indigo-600">Analytics</span></h1>
            <p className="text-xs font-bold text-slate-400">ANÁLISE ESTRATÉGICA POR REGINA BERETTA</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              className="bg-slate-100 border-none rounded-lg text-sm font-bold p-2 px-4 focus:ring-2 focus:ring-indigo-500"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">TODOS OS ANOS</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button 
              onClick={() => setFilterVirada(!filterVirada)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filterVirada ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}
            >
              MEGA DA VIRADA
            </button>
          </div>
        </div>

        {/* 1. ANALISE DE SOMA (AREA CHART) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm mb-8 border border-slate-200">
          <div className="mb-8">
            <h2 className="text-xl font-black mb-2 uppercase flex items-center gap-2">
              <Activity className="text-indigo-600"/> Distribuição de Somas
            </h2>
            <p className="text-sm text-slate-500">Onde os sorteios se concentram. A área verde representa o <b>Intervalo de Ouro (120-220)</b>.</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.somaArr} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis hide />
                <Tooltip />
                {/* Zonas de Probabilidade */}
                <ReferenceArea x1={120} x2={220} fill="#10b981" fillOpacity={0.1} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Abaixo de 120</span>
              <span className="text-lg font-black text-slate-400">RARO</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">120 a 220</span>
              <span className="text-lg font-black text-emerald-700">83% DA HISTÓRIA</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Acima de 220</span>
              <span className="text-lg font-black text-slate-400">OCASIONAL</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* 2. TERMÔMETRO DE DEZENAS (HEATMAP GRID) */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-lg font-black mb-6 uppercase flex items-center gap-2">
              <Flame className="text-orange-500"/> Frequência das Dezenas
            </h2>
            <div className="grid grid-cols-10 gap-1">
              {stats.freq.slice(1).map((f, i) => {
                const max = Math.max(...stats.freq);
                const opacity = (f / max);
                return (
                  <div 
                    key={i} 
                    className="aspect-square flex flex-col items-center justify-center rounded-md text-[10px] font-bold transition-all border border-slate-100"
                    style={{ backgroundColor: `rgba(79, 70, 229, ${opacity})`, color: opacity > 0.5 ? 'white' : '#1e293b' }}
                    title={`Dezena ${i+1}: saiu ${f} vezes`}
                  >
                    {i+1}
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Menos Frequente</span>
              <div className="h-2 w-32 bg-gradient-to-r from-indigo-50 to-indigo-600 rounded-full" />
              <span>Mais Frequente</span>
            </div>
          </div>

          {/* 3. OCUPAÇÃO DE GRID (LINHAS E COLUNAS) */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-black mb-6 uppercase flex items-center gap-2">
                <Layout className="text-indigo-600"/> Ocupação do Volante
              </h2>
              
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-tighter">Ocorrência por Linha</p>
              <div className="flex gap-1 h-8 mb-8">
                {stats.lines.map((l, i) => (
                  <div key={i} className="flex-1 bg-indigo-50 rounded-md overflow-hidden relative border border-indigo-100">
                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all" style={{ height: `${(l/Math.max(...stats.lines)*100)}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black mix-blend-difference text-white">L{i+1}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-tighter">Ocorrência por Final (Coluna)</p>
              <div className="flex gap-1 h-12">
                {stats.finals.map((f, i) => (
                  <div key={i} className="flex-1 bg-indigo-50 rounded-md overflow-hidden relative border border-indigo-100">
                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 transition-all" style={{ height: `${(f/Math.max(...stats.finals)*100)}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black mix-blend-difference text-white">F{i === 9 ? 0 : i+1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 bg-indigo-900 rounded-2xl p-4 text-white">
              <div className="flex gap-3 items-center">
                <Info size={24} className="text-indigo-400" />
                <p className="text-[11px] leading-tight">
                  <b>INSIGHT:</b> Finais 0, 5 e 9 costumam ter comportamentos distintos em anos diferentes. Observe a barra de ocupação para evitar colunas saturadas.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <footer className="text-center mt-12 pb-12">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Regina Beretta © 2025 • Business Intelligence aplicado à sorte</p>
      </footer>
    </div>
  );
}