import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';
import { Trophy, Activity, Sigma, Hash, Filter, Info, Flame, Binary, LayoutGrid, Thermometer } from 'lucide-react';
import rawData from './mega_sena_data.json';

const COLORS = {
  indigo: '#6366f1',
  pink: '#ec4899',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b'
};

// --- COMPONENTES AUXILIARES ---
const Badge = ({ children, color = "indigo" }) => (
  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-${color}-100 text-${color}-700 border border-${color}-200`}>
    {children}
  </span>
);

const StatBox = ({ title, value, percent, description, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
    <p className="text-xs font-bold text-slate-400 uppercase mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-slate-800">{value}</span>
      <span className={`text-sm font-bold text-${color}-600`}>{percent}%</span>
    </div>
    <p className="text-[10px] text-slate-500 leading-tight mt-2">{description}</p>
  </div>
);

// --- VOLANTE VISUAL ---
const VolanteVisual = () => {
  const primos = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  return (
    <div className="grid grid-cols-10 gap-1 p-4 bg-slate-900 rounded-xl border-4 border-slate-800 shadow-inner">
      {Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
        const isPrimo = primos.includes(num);
        const q = num <= 30 ? (num % 10 <= 5 && num % 10 !== 0 ? 'Q1' : 'Q2') : (num % 10 <= 5 && num % 10 !== 0 ? 'Q3' : 'Q4');
        return (
          <div key={num} className={`aspect-square flex items-center justify-center text-[8px] font-bold rounded-sm border ${isPrimo ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'border-slate-700 text-slate-600'}`}>
            {num}
          </div>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [filterVirada, setFilterVirada] = useState(false);

  const filteredData = useMemo(() => {
    return rawData.filter(game => filterVirada ? String(game.tipo).toUpperCase() === 'VIRADA' : true);
  }, [filterVirada]);

  // --- ENGINE DE CÁLCULOS ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const dist = { soma: {}, primos: {}, fib: {}, signature: {}, lines: {}, cols: {}, evens: {}, numbers: {} };
    
    filteredData.forEach(g => {
      const s = g.analises;
      dist.soma[Math.floor(s.soma/10)*10] = (dist.soma[Math.floor(s.soma/10)*10] || 0) + 1;
      dist.primos[s.primos] = (dist.primos[s.primos] || 0) + 1;
      dist.fib[s.fibonacci] = (dist.fib[s.fibonacci] || 0) + 1;
      dist.signature[s.quadrantes.assinatura] = (dist.signature[s.quadrantes.assinatura] || 0) + 1;
      dist.lines[s.linhas_vazias] = (dist.lines[s.linhas_vazias] || 0) + 1;
      dist.cols[s.colunas_vazias] = (dist.cols[s.colunas_vazias] || 0) + 1;
      dist.evens[s.pares] = (dist.evens[s.pares] || 0) + 1;
      g.dezenas.forEach(n => dist.numbers[n] = (dist.numbers[n] || 0) + 1);
    });

    const toArr = (obj) => Object.entries(obj).map(([name, value]) => ({ name, value, percent: (value/total*100).toFixed(1) })).sort((a,b) => Number(a.name) - Number(b.name));
    
    // Probabilidades combinadas
    const probSomaOuro = toArr(dist.soma).filter(x => x.name >= 160 && x.name <= 200).reduce((a,b) => a + Number(b.percent), 0);
    const probParImparEquil = (( (dist.evens[2] || 0) + (dist.evens[3] || 0) + (dist.evens[4] || 0) ) / total * 100).toFixed(1);

    return {
      soma: toArr(dist.soma),
      primos: toArr(dist.primos),
      fib: toArr(dist.fib),
      signature: toArr(dist.signature).sort((a,b) => b.value - a.value).slice(0, 5),
      lines: toArr(dist.lines),
      cols: toArr(dist.cols),
      parImpar: [{name: 'Pares', value: filteredData.reduce((a,b)=>a+b.analises.pares, 0)}, {name: 'Ímpares', value: filteredData.reduce((a,b)=>a+b.analises.impares, 0)}],
      topNumbers: Object.entries(dist.numbers).sort((a,b)=>b[1]-a[1]).slice(0, 10),
      coldNumbers: Object.entries(dist.numbers).sort((a,b)=>a[1]-b[1]).slice(0, 10),
      probSomaOuro,
      probParImparEquil,
      total
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-slate-900 pb-20 font-sans">
      <header className="bg-white border-b border-indigo-50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><Activity className="text-white" /></div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Regina <span className="text-indigo-600">Beretta</span> DataLab</h1>
          </div>
          <button onClick={() => setFilterVirada(!filterVirada)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filterVirada ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
            {filterVirada ? '✨ MEGA DA VIRADA' : 'MODO COMPLETO'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatBox title="Soma Ouro (160-200)" value="Destaque" percent={stats.probSomaOuro.toFixed(1)} color="emerald" description="Chance de o sorteio cair neste intervalo." />
          <StatBox title="Equilíbrio Par/Ímpar" value="2:4 a 4:2" percent={stats.probParImparEquil} color="indigo" description="Jogos com distribuição equilibrada." />
          <StatBox title="Assinatura 3-2-1-0" value="Top #1" percent={stats.signature[0]?.percent} color="pink" description="Padrão mais frequente de quadrantes." />
          <StatBox title="Finais Repetidos" value="5 Vazias" percent={stats.cols.find(x=>x.name==="5")?.percent} color="amber" description="Probabilidade de repetir ao menos um final." />
        </div>

        {/* ROW 1: SOMA E PAR/ÍMPAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2"><Sigma className="text-indigo-600"/> CURVA DE SOMA</h3>
                <p className="text-xs text-slate-400">Distribuição histórica das somas das 6 dezenas.</p>
              </div>
              <Badge color="emerald">Probabilidade: {stats.probSomaOuro.toFixed(1)}%</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.soma}>
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <Tooltip />
                  <ReferenceLine x="160" stroke="#10b981" strokeDasharray="3 3" />
                  <ReferenceLine x="200" stroke="#10b981" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black mb-6">EQUILÍBRIO GERAL</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.parImpar} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill={COLORS.indigo} /><Cell fill={COLORS.rose} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2: QUADRANTES EXPLICAÇÃO VISUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black mb-2 flex items-center gap-2"><LayoutGrid className="text-pink-500"/> MAPA DE QUADRANTES</h3>
            <p className="text-xs text-slate-400 mb-6">Entenda como o volante é dividido para a análise.</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Superior Esquerdo (Q1)</span>
                <p className="text-xs font-bold text-slate-600">01 a 25</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Superior Direito (Q2)</span>
                <p className="text-xs font-bold text-slate-600">06 a 30</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Inferior Esquerdo (Q3)</span>
                <p className="text-xs font-bold text-slate-600">31 a 55</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Inferior Direito (Q4)</span>
                <p className="text-xs font-bold text-slate-600">36 a 60</p>
              </div>
            </div>
            <VolanteVisual />
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Trophy className="text-amber-400"/> TOP ASSINATURAS</h3>
            <div className="space-y-6">
              {stats.signature.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold">{s.name}</span>
                    <span className="text-amber-400">{s.percent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{width: `${s.percent}%`}} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Insight de Especialista</p>
              <p className="text-xs leading-relaxed text-slate-300">
                O padrão <b>3-2-1-0</b> indica que o sorteio costuma concentrar metade dos números em um quadrante e <b>ignorar completamente</b> outro. Jogar de forma "espalhada" demais é um erro comum.
              </p>
            </div>
          </div>
        </div>

        {/* ROW 3: LINHAS, COLUNAS, PRIMOS, FIB */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase">Linhas Vazias</h4>
            <div className="h-40"><ResponsiveContainer><BarChart data={stats.lines}><XAxis dataKey="name" /><Tooltip /><Bar dataKey="value" fill={COLORS.indigo} radius={4}/></BarChart></ResponsiveContainer></div>
            <p className="text-[10px] mt-4 text-slate-500 italic">Comum: <b>2 ou 3</b> linhas vazias.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase">Colunas Vazias</h4>
            <div className="h-40"><ResponsiveContainer><BarChart data={stats.cols}><XAxis dataKey="name" /><Tooltip /><Bar dataKey="value" fill={COLORS.pink} radius={4}/></BarChart></ResponsiveContainer></div>
            <p className="text-[10px] mt-4 text-slate-500 italic">Comum: <b>5</b> colunas vazias (repetição final).</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase">Qtd Primos</h4>
            <div className="h-40"><ResponsiveContainer><BarChart data={stats.primos}><XAxis dataKey="name" /><Tooltip /><Bar dataKey="value" fill={COLORS.amber} radius={4}/></BarChart></ResponsiveContainer></div>
            <p className="text-[10px] mt-4 text-slate-500 italic">Ouro: <b>1 ou 2</b> primos (66%).</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase">Qtd Fibonacci</h4>
            <div className="h-40"><ResponsiveContainer><BarChart data={stats.fib}><XAxis dataKey="name" /><Tooltip /><Bar dataKey="value" fill={COLORS.emerald} radius={4}/></BarChart></ResponsiveContainer></div>
            <p className="text-[10px] mt-4 text-slate-500 italic">Ouro: <b>0 ou 1</b> Fibonacci (78%).</p>
          </div>
        </div>

        {/* SECTION 4: QUENTES E FRIAS */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><Thermometer /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Termômetro de Dezenas</h3>
              <p className="text-sm text-slate-400">As dezenas que mais e menos apareceram no período selecionado.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Flame className="text-orange-500" size={16}/> Top 10 Mais Frequentes</h4>
              <div className="grid grid-cols-5 gap-3">
                {stats.topNumbers.map(([num, count]) => (
                  <div key={num} className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-center">
                    <p className="text-lg font-black text-orange-600">{num}</p>
                    <p className="text-[8px] text-orange-400 uppercase font-bold">{count}x</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-blue-500" size={16}/> Top 10 Menos Frequentes</h4>
              <div className="grid grid-cols-5 gap-3">
                {stats.coldNumbers.map(([num, count]) => (
                  <div key={num} className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                    <p className="text-lg font-black text-blue-600">{num}</p>
                    <p className="text-[8px] text-blue-400 uppercase font-bold">{count}x</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer className="text-center py-10 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          © 2025 Data Analysis Project • <a href="https://reberetta.com.br" className="text-indigo-600">Regina Beretta</a>
        </p>
      </footer>
    </div>
  );
}